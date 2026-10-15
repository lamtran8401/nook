import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { activePacks, KIT_FILE, STATE_DIR } from '@kit/env/env.ts'
import { EvError, Exit, refused, usage } from '@kit/shared/errors.ts'

/** The home of the pack: the nearest environment above a folder that turns `engineering` on. */

export const KINDS = ['frontend', 'backend', 'docs', 'data', 'tool'] as const
export type AreaKind = (typeof KINDS)[number]

export type Area = {
  name: string
  /** Relative to the home. */
  path: string
  kind: AreaKind
  /** Missing means "verify fails until set"; [] means none. */
  checks?: string[]
  test?: string
  install?: string
  git: boolean
}

export type EngConfig = {
  dir: string
  backlog: string
  protected: string[]
  tracker: { type: 'none' | 'jira' | 'github' }
  areas: Area[]
  /** True when kit.yml has no `engineering` section. */
  missing: boolean
}

export type Home = { dir: string; config: EngConfig }

export const DEFAULTS = { dir: 'work', backlog: 'backlog', protected: ['main', 'master', 'develop'] }

export function findHome(cwd = process.cwd()): Home | null {
  const pack = activePacks(cwd).find(p => p.name === 'engineering')
  if (!pack) return null
  return { dir: pack.home.dir, config: readConfig(pack.home.dir) }
}

export function requireHome(cwd = process.cwd()): Home {
  const home = findHome(cwd)
  if (home) return home
  throw new EvError('not inside an environment that turns the engineering pack on', Exit.error, 'run `kit init --pack engineering` in the folder of the project, or add `engineering` to `packs:` in its kit.yml')
}

export function readConfig(dir: string): EngConfig {
  const file = join(dir, KIT_FILE)
  const data = (Bun.YAML.parse(readFileSync(file, 'utf8')) ?? {}) as Record<string, unknown>
  const section = data.engineering
  if (section === undefined || section === null) return { ...DEFAULTS, tracker: { type: 'none' }, areas: [], missing: true }
  if (typeof section !== 'object' || Array.isArray(section)) throw usage(`${file}: engineering must be a map`, 'see docs/engineering.md section 2')
  const raw = section as Record<string, unknown>
  const where = `${file}: engineering`
  const config: EngConfig = {
    dir: word(raw.dir, `${where}.dir`) ?? DEFAULTS.dir,
    backlog: word(raw.backlog, `${where}.backlog`) ?? DEFAULTS.backlog,
    protected: raw.protected === undefined ? DEFAULTS.protected : words(raw.protected, `${where}.protected`),
    tracker: tracker(raw.tracker, `${where}.tracker`),
    areas: areas(raw.areas, `${where}.areas`),
    missing: false,
  }
  return config
}

function word(value: unknown, where: string): string | undefined {
  if (value === undefined || value === null) return undefined
  if (typeof value !== 'string' || !value.trim()) throw usage(`${where} must be a word`, `write ${where.split('.').pop()}: <name>`)
  return value.trim()
}

function words(value: unknown, where: string): string[] {
  if (!Array.isArray(value) || value.some(v => typeof v !== 'string')) throw usage(`${where} must be a list of strings`, 'write it as [a, b]')
  return value as string[]
}

function tracker(value: unknown, where: string): EngConfig['tracker'] {
  if (value === undefined || value === null) return { type: 'none' }
  const type = typeof value === 'object' ? (value as Record<string, unknown>).type : value
  if (type !== 'none' && type !== 'jira' && type !== 'github') throw usage(`${where}.type must be none, jira or github`, 'write tracker: { type: none }')
  return { type }
}

function areas(value: unknown, where: string): Area[] {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value)) throw usage(`${where} must be a list`, 'write one entry for each folder: - { name, path, kind }')
  const seen = new Set<string>()
  return value.map((entry, i) => {
    const at = `${where}[${i}]`
    if (typeof entry !== 'object' || entry === null) throw usage(`${at} must be a map`, 'write name, path and kind')
    const raw = entry as Record<string, unknown>
    const name = word(raw.name, `${at}.name`)
    if (!name) throw usage(`${at} has no name`, 'add name: <area>')
    if (seen.has(name)) throw usage(`${where}: two areas are named ${name}`, 'give each area its own name')
    seen.add(name)
    const path = word(raw.path, `${at}.path`)
    if (!path) throw usage(`area ${name} has no path`, 'add path: <folder relative to the home>')
    const kind = word(raw.kind, `${at}.kind`)
    if (!KINDS.includes(kind as AreaKind)) throw usage(`area ${name}: kind must be one of ${KINDS.join(', ')}`, `write kind: ${KINDS[1]}`)
    const checks = raw.checks === undefined || raw.checks === null ? undefined : words(raw.checks, `area ${name}: checks`)
    const area: Area = { name, path, kind: kind as AreaKind, git: raw.git === undefined ? true : raw.git === true }
    if (checks) area.checks = checks
    const test = word(raw.test, `area ${name}: test`)
    if (test) area.test = test
    const install = word(raw.install, `area ${name}: install`)
    if (install) area.install = install
    if (raw.git !== undefined && typeof raw.git !== 'boolean') throw usage(`area ${name}: git must be true or false`)
    return area
  })
}

/** The folder of an area. */
export const areaDir = (home: Home, area: Area) => resolve(home.dir, area.path)
export const workDir = (home: Home, id: string) => join(home.dir, home.config.dir, id)
export const backlogDir = (home: Home, id: string) => join(home.dir, home.config.backlog, id)
export const adrDir = (home: Home) => join(home.dir, 'docs', 'adr')
export const dbFile = (home: Home) => join(home.dir, STATE_DIR, 'engineering.db')

export function areaNamed(home: Home, name: string): Area {
  const area = home.config.areas.find(a => a.name === name)
  if (area) return area
  if (home.config.missing) throw refused(`kit.yml has no engineering section, so there is no area ${name}`, 'add areas to kit.yml with /setup')
  throw refused(`area ${name} is not in kit.yml`, `areas that exist: ${home.config.areas.map(a => a.name).join(', ') || 'none'}; add it with /setup`)
}

/** The area whose folder holds `file`, the deepest first. */
export function areaOf(home: Home, file: string): Area | undefined {
  const full = resolve(file)
  return home.config.areas
    .map(area => ({ area, dir: areaDir(home, area) }))
    .filter(({ dir }) => full === dir || full.startsWith(`${dir}/`))
    .sort((a, b) => b.dir.length - a.dir.length)[0]?.area
}

export const isGitArea = (home: Home, area: Area) => area.git && existsSync(join(areaDir(home, area), '.git'))
