import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { Desk, FEATURE_NAMES, type FeatureModule, featuresHere, NOOK_FILE, STATE_DIR } from '@nook/desk/desks.ts'
import type { DeskList } from '@nook/desk/desk-list.ts'
import { usage } from '@nook/shared/errors.ts'

import { placeBlock } from './claude-block.ts'
import { addSections, nookYaml } from './nook-file.ts'
import { mergeSettings, type Settings } from './settings.ts'

const RULES_DIR = join('.claude', 'rules', 'nook')
const STYLE_FILE = join('.claude', 'output-styles', 'nook-companion.md')
const SETTINGS_FILE = join('.claude', 'settings.json')

/**
 * `with`: the features to turn on here, by an empty section of nook.yml. `pluginDir`: the folder of the plugin, whose
 * templates init copies. `list`: the list of desks of the owner, which init adds the folder to; a test leaves it out.
 */
export type InitOptions = { dir: string; with: string[]; update: boolean; pluginDir: string; modules?: FeatureModule[]; list?: DeskList }
/** `unset`: the features on here whose section /setup has not filled in yet. */
export type InitReport = { wrote: string[]; kept: string[]; features: string[]; unset: string[] }

/**
 * Scaffolds Nook in one folder: nook.yml (once), the nook block of CLAUDE.md, the base rules, the output style,
 * the nook keys of the settings, the state folder. It never touches a line that the owner wrote.
 */
export class Initializer {
  private readonly report: InitReport = { wrote: [], kept: [], features: [], unset: [] }
  private readonly wanted: string[]
  private readonly update: boolean

  constructor(private readonly options: InitOptions) {
    this.wanted = options.with.filter(name => name !== 'core')
    this.update = options.update
  }

  run(): InitReport {
    this.checkFeatures()
    this.writeNookFile()
    const desk = Desk.read(this.options.dir)
    this.report.features = featuresHere(desk).map(feature => feature.name)
    this.writeStateDir()
    this.writeClaudeBlock()
    this.writeRules(desk)
    this.writeStyle()
    this.writeSettings()
    this.setupFeatures()
    this.options.list?.add(this.options.dir)
    return this.report
  }

  private checkFeatures(): void {
    const unknown = this.wanted.find(name => !(FEATURE_NAMES as readonly string[]).includes(name))
    if (unknown) throw usage(`no feature is named "${unknown}"`, `features that exist: ${FEATURE_NAMES.filter(n => n !== 'core').join(', ')}`)
  }

  /** Made once; a later init adds an empty section for each feature that it names, and nothing else. */
  private writeNookFile(): void {
    const file = this.path(NOOK_FILE)
    if (!existsSync(file)) return this.wrote(NOOK_FILE, () => writeFileSync(file, nookYaml(this.wanted)))
    const source = readFileSync(file, 'utf8')
    const config = Desk.read(this.options.dir).config
    const missing = this.wanted.filter(name => !config.has(name))
    if (!missing.length) return this.kept(NOOK_FILE)
    this.wrote(NOOK_FILE, () => writeFileSync(file, addSections(source, missing)))
  }

  private writeStateDir(): void {
    const dir = this.path(STATE_DIR)
    if (existsSync(dir)) return
    this.wrote(`${STATE_DIR}/`, () => mkdirSync(dir, { recursive: true }))
  }

  private writeClaudeBlock(): void {
    const template = readFileSync(join(this.options.pluginDir, 'templates', 'claude-block.md'), 'utf8').trim()
    const block = template.replace('{{features}}', this.report.features.join(', '))
    const file = this.path('CLAUDE.md')
    const before = existsSync(file) ? readFileSync(file, 'utf8') : ''
    const after = placeBlock(before, block, this.update)
    if (after === before) return this.kept('CLAUDE.md')
    this.wrote('CLAUDE.md (the nook block)', () => writeFileSync(file, after))
  }

  /** One file for each base rule of the features on here; a rule turned off is not written, and goes on update. */
  private writeRules(desk: Desk): void {
    const dir = this.path(RULES_DIR)
    mkdirSync(dir, { recursive: true })
    const rules = new Map<string, string>()
    for (const name of featuresHere(desk).flatMap(feature => feature.rules)) {
      if (!desk.config.rules.off.includes(name)) rules.set(`${name}.md`, readFileSync(join(this.options.pluginDir, 'templates', 'rules', `${name}.md`), 'utf8'))
    }
    for (const [file, text] of rules) this.copy(join(RULES_DIR, file), text)
    if (!this.update) return
    for (const file of readdirSync(dir).filter(file => !rules.has(file))) {
      this.wrote(`${RULES_DIR}/${file} (removed)`, () => rmSync(join(dir, file)))
    }
  }

  private writeStyle(): void {
    mkdirSync(this.path(join('.claude', 'output-styles')), { recursive: true })
    this.copy(STYLE_FILE, readFileSync(join(this.options.pluginDir, 'templates', 'output-styles', 'nook-companion.md'), 'utf8'))
  }

  private writeSettings(): void {
    const file = this.path(SETTINGS_FILE)
    const current = existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as Settings) : {}
    const merged = mergeSettings(current, readJson(join(this.options.pluginDir, 'templates', 'settings.json')))
    const text = `${JSON.stringify(merged, null, 2)}\n`
    if (existsSync(file) && readFileSync(file, 'utf8') === text) return this.kept(SETTINGS_FILE)
    this.wrote(`${SETTINGS_FILE} (the nook keys)`, () => writeFileSync(file, text))
  }

  /** The folders and the state of each feature on here, and the features that still need /setup. */
  private setupFeatures(): void {
    for (const module of (this.options.modules ?? []).filter(m => this.report.features.includes(m.name))) {
      for (const made of module.setup(this.options.dir)) this.report.wrote.push(made)
      if (!module.configured(this.options.dir)) this.report.unset.push(module.name)
    }
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
