import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { parse } from 'yaml'

import { NOOK_FILE } from '@nook/workspace/workspaces.ts'
import { usage } from '@nook/shared/errors.ts'

import { isOneOf, ITEM_KINDS, type ItemKind } from './vocabulary.ts'

/** The `engineering` section of nook.yml (docs/reference/engineering.md section 2). Each fault names its fix. */

export const AREA_KINDS = ['frontend', 'backend', 'docs', 'data', 'tool'] as const
export type AreaKind = (typeof AREA_KINDS)[number]

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

export const DEFAULTS = { dir: 'works', backlog: 'backlog', protected: ['main', 'master', 'develop'] }

/** The prefix of an id that Nook makes for an item with no ticket, by its kind; `ids:` of the section changes one. */
export const ID_PREFIXES: Record<ItemKind, string> = { feature: 'WI', fix: 'BUG', investigate: 'INV', chore: 'CHR' }
/** The item folder before Nook named it works/; setup moves it when nook.yml keeps the default. */
export const LEGACY_DIR = 'work'

type Raw = Record<string, unknown>

type Fields = {
  dir: string
  backlog: string
  protected: string[]
  areas: Area[]
  missing: boolean
  oldTracker: boolean
  rootCauses: string[]
  unknownRootCause: string | undefined
  ids: Record<ItemKind, string>
}

export class EngineeringConfig {
  readonly dir: string
  readonly backlog: string
  readonly protected: string[]
  readonly areas: Area[]
  /** True when nook.yml has no `engineering` section. */
  readonly missing: boolean
  /** True when the section still has `tracker:`, which moved to the issue-tracker feature. */
  readonly oldTracker: boolean
  /** The root cause types of a fix in this workspace; none means any type passes. */
  readonly rootCauses: string[]
  /** The type that means "not known yet": it passes only with a reason. */
  readonly unknownRootCause: string | undefined
  private readonly ids: Record<ItemKind, string>

  private constructor(fields: Fields) {
    this.dir = fields.dir
    this.backlog = fields.backlog
    this.protected = fields.protected
    this.areas = fields.areas
    this.missing = fields.missing
    this.oldTracker = fields.oldTracker
    this.rootCauses = fields.rootCauses
    this.unknownRootCause = fields.unknownRootCause
    this.ids = fields.ids
  }

  static read(dir: string): EngineeringConfig {
    const file = join(dir, NOOK_FILE)
    return EngineeringConfig.parse(readFileSync(file, 'utf8'), file)
  }

  static parse(source: string, file: string): EngineeringConfig {
    const data = (parse(source) ?? {}) as Raw
    const section = data.engineering
    // `engineering:` alone or `engineering: {}` turns engineering on, with a section that /setup has not filled in
    if (section === undefined || section === null || (typeof section === 'object' && !Array.isArray(section) && !Object.keys(section).length)) return EngineeringConfig.empty()
    if (typeof section !== 'object' || Array.isArray(section))
      throw usage(`${file}: engineering must be a map`, 'see docs/reference/engineering.md section 2')
    const raw = section as Raw
    const where = `${file}: engineering`
    return new EngineeringConfig({
      dir: word(raw.dir, `${where}.dir`) ?? DEFAULTS.dir,
      backlog: word(raw.backlog, `${where}.backlog`) ?? DEFAULTS.backlog,
      protected:
        raw.protected === undefined ? DEFAULTS.protected : words(raw.protected, `${where}.protected`),
      areas: areas(raw.areas, `${where}.areas`),
      missing: false,
      oldTracker: raw.tracker !== undefined,
      rootCauses: raw.rootCauses === undefined ? [] : words(raw.rootCauses, `${where}.rootCauses`),
      unknownRootCause: raw.unknownRootCause === undefined ? undefined : String(raw.unknownRootCause).trim(),
      ids: ids(raw.ids, `${where}.ids`),
    })
  }

  private static empty(): EngineeringConfig {
    return new EngineeringConfig({ ...DEFAULTS, areas: [], missing: true, oldTracker: false, rootCauses: [], unknownRootCause: undefined, ids: ID_PREFIXES })
  }

  area(name: string): Area | undefined {
    return this.areas.find(a => a.name === name)
  }

  isProtected(branch: string): boolean {
    return this.protected.includes(branch)
  }

  idPrefix(kind: ItemKind): string {
    return this.ids[kind]
  }
}

/** `ids: { fix: FX }`: a prefix of capital letters and digits for a kind; the other kinds keep their default. */
function ids(value: unknown, where: string): Record<ItemKind, string> {
  if (value === undefined || value === null) return ID_PREFIXES
  if (typeof value !== 'object' || Array.isArray(value)) throw usage(`${where} must be a map of kind to prefix`, 'write it as ids: { fix: FX }')
  const given = value as Raw
  for (const [kind, prefix] of Object.entries(given)) {
    if (!isOneOf(ITEM_KINDS, kind)) throw usage(`${where}: ${kind} is not a kind`, `the kinds are ${ITEM_KINDS.join(', ')}`)
    if (typeof prefix !== 'string' || !/^[A-Z][A-Z0-9]*$/.test(prefix)) throw usage(`${where}.${kind} must be capital letters and digits, such as FX`, 'write it as ids: { fix: FX }')
  }
  return { ...ID_PREFIXES, ...(given as Partial<Record<ItemKind, string>>) }
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
