import { match, P } from 'ts-pattern'

export type Settings = { permissions?: { allow?: string[]; ask?: string[]; deny?: string[] }; [key: string]: unknown }
type Env = Record<string, string>

const LISTS = ['allow', 'ask', 'deny'] as const

/**
 * The nook keys merged into the owner's settings. Permission lists join in order with no doubles; `env` merges
 * by variable with the owner's values first; any other key is set only when the owner has none.
 */
export function mergeSettings(owner: Settings, nook: Settings): Settings {
  const result: Settings = { ...owner }
  for (const [key, value] of Object.entries(nook)) {
    match({ key, value })
      .with({ key: 'permissions' }, () => (result.permissions = mergePermissions(owner.permissions ?? {}, nook.permissions ?? {})))
      .with({ key: 'env', value: P.when(isRecord) }, ({ value }) => (result.env = { ...(value as Env), ...((result.env as Env | undefined) ?? {}) }))
      .otherwise(() => {
        if (!(key in result)) result[key] = value
      })
  }
  return result
}

function mergePermissions(owner: NonNullable<Settings['permissions']>, nook: NonNullable<Settings['permissions']>) {
  const merged = { ...owner }
  for (const list of LISTS) {
    const have = merged[list] ?? []
    merged[list] = [...have, ...(nook[list] ?? []).filter(rule => !have.includes(rule))]
  }
  return merged
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

type Lists = { allow: string[]; ask: string[]; deny: string[] }

/** A command becomes the Bash rule that matches it and its arguments: `gh pr create` is `Bash(gh pr create*)`. A rule stays as written. */
export function commandRules(commands: Lists): Lists {
  const rule = (command: string) => (/^\w+\(.*\)$/.test(command) ? command : `Bash(${command}*)`)
  return { allow: commands.allow.map(rule), ask: commands.ask.map(rule), deny: commands.deny.map(rule) }
}

/** The settings without each rule that nook wrote before and does not want now; every other rule and key stays. */
export function dropRules(settings: Settings, before: Lists, now: Lists): Settings {
  if (!settings.permissions) return settings
  const permissions = { ...settings.permissions }
  for (const list of LISTS) {
    const gone = new Set(before[list].filter(rule => !now[list].includes(rule)))
    if (permissions[list]) permissions[list] = permissions[list].filter(rule => !gone.has(rule))
  }
  return { ...settings, permissions }
}
