import { parse } from 'yaml'

import { EvError, usage } from '@nook/shared/errors.ts'

/** The keys that an older Nook read and this one does not: `nook doctor` names each as a gap. */
export const RETIRED_KEYS = ['packs', 'learn'] as const

/** The part of `nook.yml` that the core reads. Each feature reads its own section by its name. */
export class NookConfig {
  private constructor(
    readonly rules: { off: string[] },
    readonly secrets: string[],
    private readonly data: Record<string, unknown>,
  ) {}

  /** `rules: { off: [...] }`; `secrets: [...]`; one section for each feature that is on. */
  static parse(source: string, file: string): NookConfig {
    const data = readMap(source, file)
    const rules = isMap(data.rules) ? data.rules : {}
    return new NookConfig({ off: strings(rules.off, `${file}: rules.off`) }, strings(data.secrets, `${file}: secrets`), data)
  }

  /** True when the file has the key, even with no value under it: `wiki:` alone turns the wiki on. */
  has(name: string): boolean {
    return Object.hasOwn(this.data, name)
  }

  section(name: string): unknown {
    return this.data[name]
  }

  /** The retired keys that the file still has. */
  retired(): string[] {
    return RETIRED_KEYS.filter(key => this.has(key))
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

const isMap = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** A list of strings, or a usage error that names the key. A missing key is an empty list. */
export function strings(value: unknown, where: string): string[] {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value) || value.some(entry => typeof entry !== 'string')) throw usage(`${where} must be a list of strings`)
  return value as string[]
}
