import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'

import { Environment, KIT_FILE, KitConfig, type PackModule, STATE_DIR } from '@kit/env/env.ts'
import { Catalog, type Plugin } from '@kit/env/pack.ts'
import { usage } from '@kit/shared/errors.ts'

import { placeBlock } from './claude-block.ts'
import { addPacks, kitYaml } from './kit-file.ts'
import { mergeSettings, type Settings } from './settings.ts'

const RULES_DIR = join('.claude', 'rules', 'kit')
const STYLE_FILE = join('.claude', 'output-styles', 'kit-companion.md')
const SETTINGS_FILE = join('.claude', 'settings.json')

export type InitOptions = { dir: string; packs: string[]; update: boolean; coreDir: string; modules?: PackModule[] }
/** `unset`: the packs on here whose section of kit.yml /setup has not written yet. */
export type InitReport = { wrote: string[]; kept: string[]; packs: string[]; unset: string[] }

/**
 * Scaffolds the kit in one folder: kit.yml (once), the kit block of CLAUDE.md, the base rules, the output style,
 * the kit keys of the settings, the state folder. It never touches a line that the owner wrote.
 */
export class Initializer {
  private readonly report: InitReport = { wrote: [], kept: [], packs: [], unset: [] }
  private readonly wanted: string[]

  constructor(
    private readonly options: InitOptions,
    private readonly catalog = Catalog.load(),
  ) {
    this.wanted = options.packs.filter(name => name !== 'core')
  }

  run(): InitReport {
    this.checkPacks()
    this.writeKitFile()
    const env = Environment.read(this.options.dir)
    this.report.packs = ['core', ...env.config.packs]
    this.writeStateDir()
    this.writeClaudeBlock()
    this.writeRules(env.config)
    this.writeStyle()
    this.writeSettings()
    this.setupPacks()
    return this.report
  }

  private checkPacks(): void {
    const unknown = this.wanted.find(name => !this.catalog.has(name))
    if (!unknown) return
    const names = this.catalog.all().map(p => p.manifest.name)
    throw usage(`no pack is named "${unknown}"`, `packs that exist: ${names.join(', ') || 'core'}`)
  }

  /** Made once; a later init adds the packs that it names, and nothing else. */
  private writeKitFile(): void {
    const file = this.path(KIT_FILE)
    if (!existsSync(file)) return this.wrote(KIT_FILE, () => writeFileSync(file, kitYaml(this.wanted)))
    const source = readFileSync(file, 'utf8')
    const have = KitConfig.parse(source, file).packs
    const missing = this.wanted.filter(name => !have.includes(name))
    if (!missing.length) return this.kept(KIT_FILE)
    this.wrote(KIT_FILE, () => writeFileSync(file, addPacks(source, missing)))
  }

  private writeStateDir(): void {
    const dir = this.path(STATE_DIR)
    if (existsSync(dir)) return
    this.wrote(`${STATE_DIR}/`, () => mkdirSync(dir, { recursive: true }))
  }

  private writeClaudeBlock(): void {
    const template = readFileSync(join(this.options.coreDir, 'templates', 'claude-block.md'), 'utf8').trim()
    const block = template.replace('{{packs}}', this.report.packs.join(', '))
    const file = this.path('CLAUDE.md')
    const before = existsSync(file) ? readFileSync(file, 'utf8') : ''
    const after = placeBlock(before, block, this.options.update)
    if (after === before) return this.kept('CLAUDE.md')
    this.wrote('CLAUDE.md (the kit block)', () => writeFileSync(file, after))
  }

  /** One file for each base rule of the packs that are on; a rule turned off is not written, and goes on update. */
  private writeRules(config: KitConfig): void {
    const dir = this.path(RULES_DIR)
    mkdirSync(dir, { recursive: true })
    const rules = new Map<string, string>()
    for (const plugin of this.plugins()) {
      for (const rel of plugin.manifest.rules ?? []) {
        const name = basename(rel, '.md')
        if (!config.rules.off.includes(name)) rules.set(`${name}.md`, readFileSync(join(plugin.dir, rel), 'utf8'))
      }
    }
    for (const [file, text] of rules) this.copy(join(RULES_DIR, file), text)
    if (!this.options.update) return
    for (const file of readdirSync(dir).filter(file => !rules.has(file))) {
      this.wrote(`${RULES_DIR}/${file} (removed)`, () => rmSync(join(dir, file)))
    }
  }

  private writeStyle(): void {
    mkdirSync(this.path(join('.claude', 'output-styles')), { recursive: true })
    this.copy(STYLE_FILE, readFileSync(join(this.options.coreDir, 'templates', 'output-styles', 'kit-companion.md'), 'utf8'))
  }

  private writeSettings(): void {
    const file = this.path(SETTINGS_FILE)
    const current = existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as Settings) : {}
    const merged = this.plugins()
      .filter(plugin => plugin.manifest.settings)
      .reduce((settings, plugin) => mergeSettings(settings, readJson(join(plugin.dir, plugin.manifest.settings!))), current)
    const text = `${JSON.stringify(merged, null, 2)}\n`
    if (existsSync(file) && readFileSync(file, 'utf8') === text) return this.kept(SETTINGS_FILE)
    this.wrote(`${SETTINGS_FILE} (the kit keys)`, () => writeFileSync(file, text))
  }

  /** The folders and the state of each pack on here, and the packs that still need /setup. */
  private setupPacks(): void {
    for (const module of this.modulesOn()) {
      for (const made of module.setup(this.options.dir)) this.report.wrote.push(made)
      if (!module.configured(this.options.dir)) this.report.unset.push(module.name)
    }
  }

  private modulesOn(): PackModule[] {
    return (this.options.modules ?? []).filter(module => this.report.packs.includes(module.name))
  }

  private plugins(): Plugin[] {
    const core = this.catalog.get('core')
    const plugins: Plugin[] = core ? [{ dir: this.options.coreDir, manifest: core.manifest }] : []
    for (const name of this.report.packs.slice(1)) {
      const plugin = this.catalog.get(name)
      if (plugin) plugins.push(plugin)
    }
    return plugins
  }

  /** Writes a file that the kit owns: when it is missing, or on update when it differs. */
  private copy(rel: string, text: string): void {
    const file = this.path(rel)
    const differs = !existsSync(file) || readFileSync(file, 'utf8') !== text
    if (!existsSync(file) || (this.options.update && differs)) this.wrote(rel, () => writeFileSync(file, text))
  }

  private path(rel: string): string {
    return join(this.options.dir, rel)
  }

  private wrote(label: string, act: () => void): void {
    act()
    this.report.wrote.push(label)
  }

  private kept(label: string): void {
    this.report.kept.push(label)
  }
}

const readJson = (file: string): Settings => JSON.parse(readFileSync(file, 'utf8')) as Settings

export const init = (options: InitOptions): InitReport => new Initializer(options).run()
