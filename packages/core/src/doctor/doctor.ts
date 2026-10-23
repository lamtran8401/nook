import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, join } from 'node:path'

import { type ActiveFeature, activeFeatures, Desk, type FeatureModule, featuresHere, type Finding, pluginId, STATE_DIR } from '@nook/desk/desks.ts'

import { hasBlock } from '../init/claude-block.ts'

export type { Finding } from '@nook/desk/desks.ts'
export type DoctorReport = {
  /** Each desk above, the outermost first, with the features whose section its nook.yml has. */
  desks: { dir: string; features: string[] }[]
  features: { name: string; home: string }[]
  findings: Finding[]
}

type Check = (desk: Desk) => Finding[]

const update = (desk: Desk) => `run \`nook init --update\` in ${desk.dir}`
const warn = (desk: Desk, text: string, fix: string): Finding => ({ level: 'warn', where: desk.dir, text, fix })

const RETIRED: Record<string, string> = {
  packs: 'nook.yml still has `packs:`; a feature is on where nook.yml has its section',
  learn: 'nook.yml still has a `learn:` section; Nook has no learn feature now',
}

const retiredKeys: Check = desk => desk.config.retired().map(key => warn(desk, RETIRED[key]!, `delete \`${key}:\` from ${desk.dir}/nook.yml`))

const claudeBlock: Check = desk => {
  const file = join(desk.dir, 'CLAUDE.md')
  const text = existsSync(file) ? readFileSync(file, 'utf8') : ''
  return hasBlock(text) ? [] : [warn(desk, 'CLAUDE.md has no nook block', update(desk))]
}

/** A rule of the owner with the name of a base rule reads as a second voice on the same subject. */
const baseRules: Check = desk => {
  const nookDir = join(desk.dir, '.claude', 'rules', 'nook')
  if (!existsSync(nookDir)) return [warn(desk, 'the base rules are missing (.claude/rules/nook/)', update(desk))]
  const nookRules = new Set(readdirSync(nookDir).map(file => basename(file, '.md')))
  return readdirSync(join(desk.dir, '.claude', 'rules'))
    .filter(file => file.endsWith('.md') && nookRules.has(basename(file, '.md')))
    .map(file => basename(file, '.md'))
    .map(rule => warn(desk, `two rules named "${rule}": yours and Nook's; Claude can follow either`, `turn the nook rule off (rules: { off: [${rule}] }) or rename yours`))
}

const stateDir: Check = desk =>
  existsSync(join(desk.dir, STATE_DIR)) ? [] : [warn(desk, `the state folder ${STATE_DIR}/ is missing`, update(desk))]

const settings: Check = desk =>
  existsSync(join(desk.dir, '.claude', 'settings.json'))
    ? []
    : [warn(desk, '.claude/settings.json is missing: the nook permissions do not apply to a session that starts here', update(desk))]

const secrets: Check = desk =>
  desk.config.secrets
    .filter(secret => !existsSync(join(desk.dir, secret)))
    .map(secret => warn(desk, `a secret of nook.yml does not exist: ${secret}`, 'remove it from `secrets`, or check the path'))

const CHECKS: Check[] = [retiredKeys, claudeBlock, baseRules, stateDir, settings, secrets]

/** The plugins of an older Nook, one for each pack; the one plugin `nook` holds all of them now. */
const OLD_PLUGINS = ['nk-eng', 'nk-wiki', 'nk-issues', 'nk-learn']

export type DoctorOptions = {
  /** The id of the nook plugin; the one of this nook project by default. */
  plugin?: string
  /** The modules of the feature packages, for the gaps of each feature. */
  modules?: FeatureModule[]
  /** The user folder of Claude Code; `CLAUDE_CONFIG_DIR` or `~/.claude`. */
  claudeDir?: string
}

const CLAUDE_WHERE = 'Claude Code'

export class Doctor {
  private readonly plugin: string | undefined
  private readonly modules: FeatureModule[]
  private readonly claudeDir: string

  constructor(
    private readonly from: string,
    options: DoctorOptions = {},
  ) {
    this.plugin = options.plugin ?? pluginId()
    this.modules = options.modules ?? []
    this.claudeDir = options.claudeDir ?? process.env.CLAUDE_CONFIG_DIR ?? join(homedir(), '.claude')
  }

  run(): DoctorReport {
    const desks = Desk.above(this.from)
    if (!desks.length) return { desks: [], features: [], findings: [this.outside()] }
    const active = activeFeatures(this.from)
    const findings = [...desks.flatMap(desk => CHECKS.flatMap(check => check(desk))), ...this.plugins(desks), ...active.flatMap(feature => this.featureGaps(feature))]
    if (!findings.length) findings.push(this.healthy(desks.length, active.length))
    return {
      desks: desks.map(desk => ({ dir: desk.dir, features: featuresHere(desk).map(f => f.name).filter(name => name !== 'core') })),
      features: active.map(f => ({ name: f.name, home: f.home.dir })),
      findings,
    }
  }

  /** With the nook plugin off, no hook and no skill runs, so each guard is off; a plugin of an older Nook points at folders that are gone. */
  private plugins(desks: Desk[]): Finding[] {
    const on = enabledPlugins([join(this.claudeDir, 'settings.json'), ...desks.flatMap(settingsFiles)])
    const off: Finding[] = this.plugin && !on.has(this.plugin) ? [{ level: 'error', where: CLAUDE_WHERE, text: `the plugin ${this.plugin} is off: its hooks and skills do not run`, fix: `claude plugin install ${this.plugin}` }] : []
    const marketplace = this.plugin?.split('@')[1]
    const old = OLD_PLUGINS.map(name => `${name}@${marketplace}`).filter(id => on.has(id))
    return [...off, ...old.map(id => ({ level: 'warn' as const, where: CLAUDE_WHERE, text: `the plugin ${id} of an older Nook is still on; the plugin ${this.plugin} holds its parts now`, fix: `claude plugin uninstall ${id}` }))]
  }

  /** The gaps that a feature finds in its home, named by the feature. */
  private featureGaps(feature: ActiveFeature): Finding[] {
    const module = this.modules.find(m => m.name === feature.name)
    if (!module) return []
    const unset = module.configured(feature.home.dir) ? [] : [warn(feature.home, `the \`${feature.name}:\` section of nook.yml is not filled in`, 'in Claude Code, run /setup')]
    return [...unset, ...module.doctor(feature.home.dir)]
      .filter(f => f.level !== 'ok')
      .map(f => ({ ...f, text: `${feature.name}: ${f.text}` }))
  }

  private outside(): Finding {
    return { level: 'error', where: this.from, text: 'not inside a desk: no nook.yml here or above', fix: 'run `nook init` in this folder or in one above it' }
  }

  private healthy(desks: number, features: number): Finding {
    return { level: 'ok', where: this.from, text: `${desks} desk${desks > 1 ? 's' : ''} above, ${features} feature${features > 1 ? 's' : ''} on, no gap` }
  }
}

export const doctor = (from: string, options: DoctorOptions = {}): DoctorReport => new Doctor(from, options).run()

const settingsFiles = (desk: Desk) => ['settings.json', 'settings.local.json'].map(name => join(desk.dir, '.claude', name))

/** The plugin ids that are on in any of the settings files: a later file can turn one off again. */
function enabledPlugins(files: string[]): Set<string> {
  const on = new Set<string>()
  for (const file of files.filter(existsSync)) {
    const plugins = (JSON.parse(readFileSync(file, 'utf8')) as { enabledPlugins?: Record<string, boolean> }).enabledPlugins ?? {}
    for (const [id, enabled] of Object.entries(plugins)) enabled ? on.add(id) : on.delete(id)
  }
  return on
}
