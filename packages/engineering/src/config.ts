import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { parse } from 'yaml'

import { NOOK_FILE } from '@nook/env/env.ts'
import { usage } from '@nook/shared/errors.ts'

/** The `engineering` section of nook.yml (docs/engineering.md section 2). Each fault names its fix. */

export const AREA_KINDS = ['frontend', 'backend', 'docs', 'data', 'tool'] as const
export type AreaKind = (typeof AREA_KINDS)[number]
export const TRACKERS = ['none', 'jira', 'github'] as const
export type Tracker = { type: (typeof TRACKERS)[number] }

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

export const DEFAULTS = { dir: 'work', backlog: 'backlog', protected: ['main', 'master', 'develop'] }

type Raw = Record<string, unknown>

type Fields = {
  dir: string
  backlog: string
  protected: string[]
  tracker: Tracker
  areas: Area[]
  missing: boolean
}

export class EngineeringConfig {
  readonly dir: string
  readonly backlog: string
  readonly protected: string[]
  readonly tracker: Tracker
  readonly areas: Area[]
  /** True when nook.yml has no `engineering` section. */
  readonly missing: boolean

  private constructor(fields: Fields) {
    this.dir = fields.dir
    this.backlog = fields.backlog
    this.protected = fields.protected
    this.tracker = fields.tracker
    this.areas = fields.areas
    this.missing = fields.missing
  }

  static read(dir: string): EngineeringConfig {
    const file = join(dir, NOOK_FILE)
    return EngineeringConfig.parse(readFileSync(file, 'utf8'), file)
  }

  static parse(source: string, file: string): EngineeringConfig {
    const data = (parse(source) ?? {}) as Raw
    const section = data.engineering
    if (section === undefined || section === null) return EngineeringConfig.empty()
    if (typeof section !== 'object' || Array.isArray(section))
      throw usage(`${file}: engineering must be a map`, 'see docs/engineering.md section 2')
    const raw = section as Raw
    const where = `${file}: engineering`
    return new EngineeringConfig({
      dir: word(raw.dir, `${where}.dir`) ?? DEFAULTS.dir,
      backlog: word(raw.backlog, `${where}.backlog`) ?? DEFAULTS.backlog,
      protected:
        raw.protected === undefined ? DEFAULTS.protected : words(raw.protected, `${where}.protected`),
      tracker: tracker(raw.tracker, `${where}.tracker`),
      areas: areas(raw.areas, `${where}.areas`),
      missing: false,
    })
  }

  private static empty(): EngineeringConfig {
    return new EngineeringConfig({ ...DEFAULTS, tracker: { type: 'none' }, areas: [], missing: true })
  }

  area(name: string): Area | undefined {
    return this.areas.find(a => a.name === name)
  }

  isProtected(branch: string): boolean {
    return this.protected.includes(branch)
  }
}

function word(value: unknown, where: string): string | undefined {
  if (value === undefined || value === null) return undefined
  if (typeof value !== 'string' || !value.trim())
    throw usage(`${where} must be a word`, `write ${where.split('.').pop()}: <name>`)
  return value.trim()
}

function words(value: unknown, where: string): string[] {
  if (!Array.isArray(value) || value.some(v => typeof v !== 'string'))
    throw usage(`${where} must be a list of strings`, 'write it as [a, b]')
  return value as string[]
}

function tracker(value: unknown, where: string): Tracker {
  if (value === undefined || value === null) return { type: 'none' }
  const type = typeof value === 'object' ? (value as Raw).type : value
  if (!TRACKERS.includes(type as Tracker['type']))
    throw usage(`${where}.type must be none, jira or github`, 'write tracker: { type: none }')
  return { type: type as Tracker['type'] }
}

function areas(value: unknown, where: string): Area[] {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value))
    throw usage(`${where} must be a list`, 'write one entry for each folder: - { name, path, kind }')
  const seen = new Set<string>()
  return value.map((entry, i) => {
    const area = readArea(entry, `${where}[${i}]`)
    if (seen.has(area.name))
      throw usage(`${where}: two areas are named ${area.name}`, 'give each area its own name')
    seen.add(area.name)
    return area
  })
}

function readArea(entry: unknown, at: string): Area {
  if (typeof entry !== 'object' || entry === null)
    throw usage(`${at} must be a map`, 'write name, path and kind')
  const raw = entry as Raw
  const name = word(raw.name, `${at}.name`)
  if (!name) throw usage(`${at} has no name`, 'add name: <area>')
  const path = word(raw.path, `${at}.path`)
  if (!path) throw usage(`area ${name} has no path`, 'add path: <folder relative to the home>')
  const kind = word(raw.kind, `${at}.kind`)
  if (!AREA_KINDS.includes(kind as AreaKind))
    throw usage(`area ${name}: kind must be one of ${AREA_KINDS.join(', ')}`, `write kind: ${AREA_KINDS[1]}`)
  const checks =
    raw.checks === undefined || raw.checks === null ? undefined : words(raw.checks, `area ${name}: checks`)
  const area: Area = {
    name,
    path,
    kind: kind as AreaKind,
    git: raw.git === undefined ? true : raw.git === true,
  }
  if (checks) area.checks = checks
  const test = word(raw.test, `area ${name}: test`)
  if (test) area.test = test
  const install = word(raw.install, `area ${name}: install`)
  if (install) area.install = install
  if (raw.git !== undefined && typeof raw.git !== 'boolean')
    throw usage(`area ${name}: git must be true or false`)
  return area
}
