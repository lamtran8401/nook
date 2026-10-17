import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'

import { Desk, NOOK_FILE, NookConfig, type PackModule, STATE_DIR } from '@nook/desk/desks.ts'
import type { DeskList } from '@nook/desk/desk-list.ts'
import { Catalog, type Plugin } from '@nook/desk/pack.ts'
import { usage } from '@nook/shared/errors.ts'

import { placeBlock } from './claude-block.ts'
import { addPacks, nookYaml } from './nook-file.ts'
import { mergeSettings, type Settings } from './settings.ts'

const RULES_DIR = join('.claude', 'rules', 'nook')
const STYLE_FILE = join('.claude', 'output-styles', 'nook-companion.md')
const SETTINGS_FILE = join('.claude', 'settings.json')

/** `list`: the list of desks of the owner, which init adds the folder to; a test leaves it out. */
export type InitOptions = { dir: string; packs: string[]; update: boolean; coreDir: string; modules?: PackModule[]; list?: DeskList }
/** `unset`: the packs on here whose section of nook.yml /setup has not written yet. */
export type InitReport = { wrote: string[]; kept: string[]; packs: string[]; unset: string[] }

/**
 * Scaffolds Nook in one folder: nook.yml (once), the nook block of CLAUDE.md, the base rules, the output style,
 * the nook keys of the settings, the state folder. It never touches a line that the owner wrote.
 */
export class Initializer {
  private readonly report: InitReport = { wrote: [], kept: [], packs: [], unset: [] }
  private readonly wanted: string[]
  private readonly update: boolean

  constructor(
    private readonly options: InitOptions,
    private readonly catalog = Catalog.load(),
  ) {
    this.wanted = options.packs.filter(name => name !== 'core')
    this.update = options.update
  }

  run(): InitReport {
    this.checkPacks()
    this.writeNookFile()
    const desk = Desk.read(this.options.dir)
    this.report.packs = ['core', ...desk.config.packs]
    this.writeStateDir()
    this.writeClaudeBlock()
    this.writeRules(desk.config)
    this.writeStyle()
    this.writeSettings()
    this.setupPacks()
    this.options.list?.add(this.options.dir)
    return this.report
  }

  private checkPacks(): void {
    const unknown = this.wanted.find(name => !this.catalog.has(name))
    if (!unknown) return
    const names = this.catalog.all().map(p => p.manifest.name)
    throw usage(`no pack is named "${unknown}"`, `packs that exist: ${names.join(', ') || 'core'}`)
  }

  /** Made once; a later init adds the packs that it names, and nothing else. */
  private writeNookFile(): void {
    const file = this.path(NOOK_FILE)
    if (!existsSync(file)) return this.wrote(NOOK_FILE, () => writeFileSync(file, nookYaml(this.wanted)))
    const source = readFileSync(file, 'utf8')
    const have = NookConfig.parse(source, file).packs
    const missing = this.wanted.filter(name => !have.includes(name))
    if (!missing.length) return this.kept(NOOK_FILE)
    this.wrote(NOOK_FILE, () => writeFileSync(file, addPacks(source, missing)))
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
    const after = placeBlock(before, block, this.update)
    if (after === before) return this.kept('CLAUDE.md')
    this.wrote('CLAUDE.md (the nook block)', () => writeFileSync(file, after))
  }

  /** One file for each base rule of the packs that are on; a rule turned off is not written, and goes on update. */
  private writeRules(config: NookConfig): void {
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
    if (!this.update) return
    for (const file of readdirSync(dir).filter(file => !rules.has(file))) {
      this.wrote(`${RULES_DIR}/${file} (removed)`, () => rmSync(join(dir, file)))
    }
  }

  private writeStyle(): void {
    mkdirSync(this.path(join('.claude', 'output-styles')), { recursive: true })
    this.copy(STYLE_FILE, readFileSync(join(this.options.coreDir, 'templates', 'output-styles', 'nook-companion.md'), 'utf8'))
  }

  private writeSettings(): void {
    const file = this.path(SETTINGS_FILE)
    const current = existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as Settings) : {}
    const merged = this.plugins()
      .filter(plugin => plugin.manifest.settings)
      .reduce((settings, plugin) => mergeSettings(settings, readJson(join(plugin.dir, plugin.manifest.settings!))), current)
    const text = `${JSON.stringify(merged, null, 2)}\n`
    if (existsSync(file) && readFileSync(file, 'utf8') === text) return this.kept(SETTINGS_FILE)
    this.wrote(`${SETTINGS_FILE} (the nook keys)`, () => writeFileSync(file, text))
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

  /** Writes a file that Nook owns: when it is missing, or on update when it differs. */
  private copy(rel: string, text: string): void {
    const file = this.path(rel)
    const differs = !existsSync(file) || readFileSync(file, 'utf8') !== text
    if (!existsSync(file) || (this.update && differs)) this.wrote(rel, () => writeFileSync(file, text))
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
