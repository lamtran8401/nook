import { parse } from 'yaml'

import { EvError, usage } from '@kit/shared/errors.ts'

/** The part of `kit.yml` that the core reads. Each pack reads its own section by its name. */
export class KitConfig {
  private constructor(
    readonly packs: string[],
    /** Packs of a parent environment that this one turns off. */
    readonly off: string[],
    readonly rules: { off: string[] },
    readonly secrets: string[],
    private readonly data: Record<string, unknown>,
  ) {}

  /** `packs: [a, b]` or `packs: { on: [a], off: [b] }`; `rules: { off: [...] }`; `secrets: [...]`. */
  static parse(source: string, file: string): KitConfig {
    const data = readMap(source, file)
    const { packs, off } = readPacks(data.packs, file)
    const rules = isMap(data.rules) ? data.rules : {}
    return new KitConfig(packs, off, { off: strings(rules.off, `${file}: rules.off`) }, strings(data.secrets, `${file}: secrets`), data)
  }

  section(name: string): unknown {
    return this.data[name]
  }
}

function readMap(source: string, file: string): Record<string, unknown> {
  let data: unknown
  try {
    data = parse(source) ?? {}
  } catch (error) {
    throw new EvError(`${file} is not valid YAML: ${(error as Error).message}`)
  }
  if (!isMap(data)) throw usage(`${file} must hold a map of keys`)
  return data
}

function readPacks(value: unknown, file: string): { packs: string[]; off: string[] } {
  if (Array.isArray(value)) return { packs: strings(value, `${file}: packs`), off: [] }
  if (!isMap(value)) return { packs: [], off: [] }
  return { packs: strings(value.on, `${file}: packs.on`), off: strings(value.off, `${file}: packs.off`) }
}

const isMap = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** A list of strings, or a usage error that names the key. A missing key is an empty list. */
export function strings(value: unknown, where: string): string[] {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value) || value.some(entry => typeof entry !== 'string')) throw usage(`${where} must be a list of strings`)
  return value as string[]
}
