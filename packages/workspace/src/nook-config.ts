import { parse } from 'yaml'

import { EvError, usage } from '@nook/shared/errors.ts'

/** The keys that an older Nook read and this one does not: `nook doctor` names each as a gap. */
export const RETIRED_KEYS = ['packs', 'learn'] as const

export const BUDGETS = ['lean', 'deep'] as const
export type Budget = (typeof BUDGETS)[number]

/** The commands that an agent may run, that ask the owner first, and that never run: each a command or a rule of Claude Code. */
export type Commands = { allow: string[]; ask: string[]; deny: string[] }

/** The part of `nook.yml` that the core reads. Each feature reads its own section by its name. */
export class NookConfig {
  private constructor(
    readonly rules: { off: string[] },
    readonly secrets: string[],
    readonly commands: Commands,
    private readonly data: Record<string, unknown>,
  ) {}

  /** `rules: { off: [...] }`; `secrets: [...]`; `budget`; `guards: { commands: { allow, ask, deny } }`; one section for each feature that is on. */
  static parse(source: string, file: string): NookConfig {
    const data = readMap(source, file)
    const rules = isMap(data.rules) ? data.rules : {}
    const guards = isMap(data.guards) ? data.guards : {}
    const commands = isMap(guards.commands) ? guards.commands : {}
    const list = (key: keyof Commands) => strings(commands[key], `${file}: guards.commands.${key}`)
    return new NookConfig({ off: strings(rules.off, `${file}: rules.off`) }, strings(data.secrets, `${file}: secrets`), { allow: list('allow'), ask: list('ask'), deny: list('deny') }, data)
  }

  /** How many agents a skill may start: lean when the file says nothing, null when it names a value that Nook does not know. */
  get budget(): Budget | null {
    const value = this.data.budget ?? 'lean'
    return BUDGETS.find(budget => budget === value) ?? null
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
