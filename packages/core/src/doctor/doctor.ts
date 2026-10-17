import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, join } from 'node:path'

import { activePacks, type ActivePack, Environment, type Finding, NOOK_FILE, type PackModule, STATE_DIR } from '@nook/env/env.ts'
import { Catalog } from '@nook/env/pack.ts'

import { hasBlock } from '../init/claude-block.ts'

export type { Finding } from '@nook/env/env.ts'
export type DoctorReport = {
  environments: { dir: string; packs: string[]; off: string[] }[]
  packs: { name: string; home: string }[]
  findings: Finding[]
}

type Check = (env: Environment, catalog: Catalog) => Finding[]

const update = (env: Environment) => `run \`nook init --update\` in ${env.dir}`
const warn = (env: Environment, text: string, fix: string): Finding => ({ level: 'warn', where: env.dir, text, fix })

const unknownPacks: Check = (env, catalog) =>
  env.config.packs
    .filter(name => name !== 'core' && !catalog.has(name))
    .map(name => ({ level: 'error', where: env.dir, text: `nook.yml names a pack that does not exist: ${name}`, fix: `remove it, or install a nook that ships "${name}"` }))

const claudeBlock: Check = env => {
  const file = join(env.dir, 'CLAUDE.md')
  const text = existsSync(file) ? readFileSync(file, 'utf8') : ''
  return hasBlock(text) ? [] : [warn(env, 'CLAUDE.md has no nook block', update(env))]
}

/** A rule of the owner with the name of a base rule reads as a second voice on the same subject. */
const baseRules: Check = env => {
  const nookDir = join(env.dir, '.claude', 'rules', 'nook')
  if (!existsSync(nookDir)) return [warn(env, 'the base rules are missing (.claude/rules/nook/)', update(env))]
  const nookRules = new Set(readdirSync(nookDir).map(file => basename(file, '.md')))
  return readdirSync(join(env.dir, '.claude', 'rules'))
    .filter(file => file.endsWith('.md') && nookRules.has(basename(file, '.md')))
    .map(file => basename(file, '.md'))
    .map(rule => warn(env, `two rules named "${rule}": yours and Nook's; Claude can follow either`, `turn the nook rule off (rules: { off: [${rule}] }) or rename yours`))
}

const stateDir: Check = env =>
  existsSync(join(env.dir, STATE_DIR)) ? [] : [warn(env, `the state folder ${STATE_DIR}/ is missing`, update(env))]

const settings: Check = env =>
  existsSync(join(env.dir, '.claude', 'settings.json'))
    ? []
    : [warn(env, '.claude/settings.json is missing: the nook permissions do not apply to a session that starts here', update(env))]

const secrets: Check = env =>
  env.config.secrets
    .filter(secret => !existsSync(join(env.dir, secret)))
    .map(secret => warn(env, `a secret of nook.yml does not exist: ${secret}`, 'remove it from `secrets`, or check the path'))

const emptyPacksKey: Check = env =>
  /^\s*packs:\s*$/m.test(readFileSync(join(env.dir, NOOK_FILE), 'utf8'))
    ? [warn(env, 'nook.yml has an empty `packs:` key', 'write `packs: []` or list the packs')]
    : []

const CHECKS: Check[] = [unknownPacks, claudeBlock, baseRules, stateDir, settings, secrets, emptyPacksKey]

export type DoctorOptions = {
  catalog?: Catalog
  /** The modules of the pack packages, for the gaps of each pack. */
  modules?: PackModule[]
  /** The user folder of Claude Code; `CLAUDE_CONFIG_DIR` or `~/.claude`. */
  claudeDir?: string
}

const CLAUDE_WHERE = 'Claude Code'

export class Doctor {
  private readonly catalog: Catalog
  private readonly modules: PackModule[]
  private readonly claudeDir: string

  constructor(
    private readonly from: string,
    options: DoctorOptions = {},
  ) {
    this.catalog = options.catalog ?? Catalog.load()
    this.modules = options.modules ?? []
    this.claudeDir = options.claudeDir ?? process.env.CLAUDE_CONFIG_DIR ?? join(homedir(), '.claude')
  }

  run(): DoctorReport {
    const envs = Environment.above(this.from)
    if (!envs.length) return { environments: [], packs: [], findings: [this.outside()] }
    const active = activePacks(this.from)
    const findings = [
      ...envs.flatMap(env => CHECKS.flatMap(check => check(env, this.catalog))),
      ...this.pluginsOff(envs, active),
      ...active.flatMap(pack => this.packGaps(pack)),
    ]
    const packs = active.map(p => ({ name: p.name, home: p.home.dir }))
    if (!findings.length) findings.push(this.healthy(envs.length, packs.length + 1))
    return {
      environments: envs.map(e => ({ dir: e.dir, packs: e.config.packs, off: e.config.off })),
      packs: [{ name: 'core', home: envs[0]!.dir }, ...packs],
      findings,
    }
  }

  /** A pack whose plugin Claude Code does not load has no hooks and no skills, so each guard is off. */
  private pluginsOff(envs: Environment[], active: ActivePack[]): Finding[] {
    const on = enabledPlugins([join(this.claudeDir, 'settings.json'), ...envs.flatMap(settingsFiles)])
    return ['core', ...active.map(p => p.name)].flatMap(pack => {
      const id = this.catalog.pluginId(pack)
      if (!id || on.has(id)) return []
      return [{ level: 'error', where: CLAUDE_WHERE, text: `the plugin ${id} of the pack ${pack} is off: its hooks and skills do not run`, fix: `claude plugin install ${id}` } satisfies Finding]
    })
  }

  /** The gaps that a pack finds in its home, named by the pack. */
  private packGaps(pack: ActivePack): Finding[] {
    const module = this.modules.find(m => m.name === pack.name)
    if (!module) return []
    const unset = module.configured(pack.home.dir) ? [] : [warn(pack.home, `nook.yml has no \`${pack.name}:\` section`, 'in Claude Code, run /setup')]
    return [...unset, ...module.doctor(pack.home.dir)]
      .filter(f => f.level !== 'ok')
      .map(f => ({ ...f, text: `${pack.name}: ${f.text}` }))
  }

  private outside(): Finding {
    return { level: 'error', where: this.from, text: 'not inside an environment: no nook.yml here or above', fix: 'run `nook init` in this folder or in one above it' }
  }

  private healthy(envs: number, packs: number): Finding {
    return { level: 'ok', where: this.from, text: `${envs} environment${envs > 1 ? 's' : ''} above, ${packs} packs on, no gap` }
  }
}

export const doctor = (from: string, options: DoctorOptions = {}): DoctorReport => new Doctor(from, options).run()

const settingsFiles = (env: Environment) => ['settings.json', 'settings.local.json'].map(name => join(env.dir, '.claude', name))

/** The plugin ids that are on in any of the settings files: a later file can turn one off again. */
function enabledPlugins(files: string[]): Set<string> {
  const on = new Set<string>()
  for (const file of files.filter(existsSync)) {
    const plugins = (JSON.parse(readFileSync(file, 'utf8')) as { enabledPlugins?: Record<string, boolean> }).enabledPlugins ?? {}
    for (const [id, enabled] of Object.entries(plugins)) enabled ? on.add(id) : on.delete(id)
  }
  return on
}
