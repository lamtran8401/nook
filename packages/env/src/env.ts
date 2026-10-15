import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

import { EvError, usage } from '@kit/shared/errors.ts'

/** The file that marks a folder as an environment. */
export const KIT_FILE = 'kit.yml'
/** The state folder of an environment. */
export const STATE_DIR = '.kit'

/** The part of `kit.yml` that the core reads. Each pack reads its own section by its name. */
export type KitConfig = {
  packs: string[]
  /** Packs of a parent environment that this one turns off. */
  off: string[]
  rules: { off: string[] }
  secrets: string[]
  [section: string]: unknown
}

export type Environment = { dir: string; config: KitConfig }

export function parseKitConfig(source: string, file: string): KitConfig {
  let data: unknown
  try {
    data = Bun.YAML.parse(source) ?? {}
  } catch (error) {
    throw new EvError(`${file} is not valid YAML: ${(error as Error).message}`)
  }
  if (typeof data !== 'object' || Array.isArray(data) || data === null) throw usage(`${file} must hold a map of keys`)
  const record = data as Record<string, unknown>
  const packsValue = record.packs
  // `packs: [a, b]` or `packs: { on: [a], off: [b] }`
  let packs: string[] = []
  let off: string[] = []
  if (Array.isArray(packsValue)) packs = strings(packsValue, `${file}: packs`)
  else if (packsValue && typeof packsValue === 'object') {
    const map = packsValue as Record<string, unknown>
    packs = strings(map.on, `${file}: packs.on`)
    off = strings(map.off, `${file}: packs.off`)
  }
  const rulesValue = (record.rules ?? {}) as Record<string, unknown>
  const rules = { off: strings(typeof rulesValue === 'object' && rulesValue ? rulesValue.off : [], `${file}: rules.off`) }
  return { ...record, packs, off, rules, secrets: strings(record.secrets, `${file}: secrets`) }
}

export function strings(value: unknown, where: string): string[] {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value) || value.some(entry => typeof entry !== 'string')) throw usage(`${where} must be a list of strings`)
  return value as string[]
}

export function readEnvironment(dir: string): Environment {
  const file = join(dir, KIT_FILE)
  return { dir, config: parseKitConfig(readFileSync(file, 'utf8'), file) }
}

/** Every environment from the root down to `from`: the outermost first. */
export function environmentsAbove(from = process.cwd()): Environment[] {
  const found: Environment[] = []
  let dir = resolve(from)
  while (true) {
    if (existsSync(join(dir, KIT_FILE))) found.push(readEnvironment(dir))
    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return found.reverse()
}

/** The nearest environment that holds `from`, or null. */
export function nearestEnvironment(from = process.cwd()): Environment | null {
  const all = environmentsAbove(from)
  return all[all.length - 1] ?? null
}

/** One pack that is on for a folder, and the environment that holds its record. */
export type ActivePack = { name: string; home: Environment }

/**
 * The packs that are on in `from`: the union of every environment above it, in order.
 * A child that names a pack again becomes its home. A child can turn a pack of a parent off.
 */
export function activePacks(from = process.cwd()): ActivePack[] {
  const active = new Map<string, Environment>()
  for (const env of environmentsAbove(from)) {
    for (const name of env.config.off) active.delete(name)
    for (const name of env.config.packs) active.set(name, env)
  }
  return [...active].map(([name, home]) => ({ name, home }))
}

/** The secret files of every environment above `from`, resolved to absolute paths. */
export function secretsAbove(from = process.cwd()): string[] {
  return environmentsAbove(from).flatMap(env => env.config.secrets.map(secret => resolve(env.dir, secret)))
}

/** The folder of the kit project: the repo that holds `apps/`, `packages/` and `plugins/`. */
export function projectRoot(): string {
  if (process.env.KIT_PROJECT) return resolve(process.env.KIT_PROJECT)
  return resolve(import.meta.dir, '..', '..', '..')
}
