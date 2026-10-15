import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { basename, join } from 'node:path'

import { activePacks, Environment, KIT_FILE, STATE_DIR } from '@kit/env/env.ts'
import { Catalog } from '@kit/env/pack.ts'

import { hasBlock } from '../init/claude-block.ts'

export type Finding = { level: 'error' | 'warn' | 'ok'; where: string; text: string; fix?: string }
export type DoctorReport = {
  environments: { dir: string; packs: string[]; off: string[] }[]
  packs: { name: string; home: string }[]
  findings: Finding[]
}

type Check = (env: Environment, catalog: Catalog) => Finding[]

const update = (env: Environment) => `run \`kit init --update\` in ${env.dir}`
const warn = (env: Environment, text: string, fix: string): Finding => ({ level: 'warn', where: env.dir, text, fix })

const unknownPacks: Check = (env, catalog) =>
  env.config.packs
    .filter(name => name !== 'core' && !catalog.has(name))
    .map(name => ({ level: 'error', where: env.dir, text: `kit.yml names a pack that does not exist: ${name}`, fix: `remove it, or install a kit that ships "${name}"` }))

const claudeBlock: Check = env => {
  const file = join(env.dir, 'CLAUDE.md')
  const text = existsSync(file) ? readFileSync(file, 'utf8') : ''
  return hasBlock(text) ? [] : [warn(env, 'CLAUDE.md has no kit block', update(env))]
}

/** A rule of the owner with the name of a base rule reads as a second voice on the same subject. */
const baseRules: Check = env => {
  const kitDir = join(env.dir, '.claude', 'rules', 'kit')
  if (!existsSync(kitDir)) return [warn(env, 'the base rules are missing (.claude/rules/kit/)', update(env))]
  const kitRules = new Set(readdirSync(kitDir).map(file => basename(file, '.md')))
  return readdirSync(join(env.dir, '.claude', 'rules'))
    .filter(file => file.endsWith('.md') && kitRules.has(basename(file, '.md')))
    .map(file => basename(file, '.md'))
    .map(rule => warn(env, `two rules named "${rule}": yours and the kit's; Claude can follow either`, `turn the kit rule off (rules: { off: [${rule}] }) or rename yours`))
}

const stateDir: Check = env =>
  existsSync(join(env.dir, STATE_DIR)) ? [] : [warn(env, `the state folder ${STATE_DIR}/ is missing`, update(env))]

const settings: Check = env =>
  existsSync(join(env.dir, '.claude', 'settings.json'))
    ? []
    : [warn(env, '.claude/settings.json is missing: the kit permissions do not apply to a session that starts here', update(env))]

const secrets: Check = env =>
  env.config.secrets
    .filter(secret => !existsSync(join(env.dir, secret)))
    .map(secret => warn(env, `a secret of kit.yml does not exist: ${secret}`, 'remove it from `secrets`, or check the path'))

const emptyPacksKey: Check = env =>
  /^\s*packs:\s*$/m.test(readFileSync(join(env.dir, KIT_FILE), 'utf8'))
    ? [warn(env, 'kit.yml has an empty `packs:` key', 'write `packs: []` or list the packs')]
    : []

const CHECKS: Check[] = [unknownPacks, claudeBlock, baseRules, stateDir, settings, secrets, emptyPacksKey]

export class Doctor {
  constructor(
    private readonly from: string,
    private readonly catalog = Catalog.load(),
  ) {}

  run(): DoctorReport {
    const envs = Environment.above(this.from)
    if (!envs.length) return { environments: [], packs: [], findings: [this.outside()] }
    const findings = envs.flatMap(env => CHECKS.flatMap(check => check(env, this.catalog)))
    const packs = activePacks(this.from).map(p => ({ name: p.name, home: p.home.dir }))
    if (!findings.length) findings.push(this.healthy(envs.length, packs.length + 1))
    return {
      environments: envs.map(e => ({ dir: e.dir, packs: e.config.packs, off: e.config.off })),
      packs: [{ name: 'core', home: envs[0]!.dir }, ...packs],
      findings,
    }
  }

  private outside(): Finding {
    return { level: 'error', where: this.from, text: 'not inside an environment: no kit.yml here or above', fix: 'run `kit init` in this folder or in one above it' }
  }

  private healthy(envs: number, packs: number): Finding {
    return { level: 'ok', where: this.from, text: `${envs} environment${envs > 1 ? 's' : ''} above, ${packs} packs on, no gap` }
  }
}

export const doctor = (from: string): DoctorReport => new Doctor(from).run()
