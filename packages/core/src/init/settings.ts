import { match, P } from 'ts-pattern'

export type Settings = { permissions?: { allow?: string[]; ask?: string[]; deny?: string[] }; [key: string]: unknown }
type Env = Record<string, string>

const LISTS = ['allow', 'ask', 'deny'] as const

/**
 * The kit keys merged into the owner's settings. Permission lists join in order with no doubles; `env` merges
 * by variable with the owner's values first; any other key is set only when the owner has none.
 */
export function mergeSettings(owner: Settings, kit: Settings): Settings {
  const result: Settings = { ...owner }
  for (const [key, value] of Object.entries(kit)) {
    match({ key, value })
      .with({ key: 'permissions' }, () => (result.permissions = mergePermissions(owner.permissions ?? {}, kit.permissions ?? {})))
      .with({ key: 'env', value: P.when(isRecord) }, ({ value }) => (result.env = { ...(value as Env), ...((result.env as Env | undefined) ?? {}) }))
      .otherwise(() => {
        if (!(key in result)) result[key] = value
      })
  }
  return result
}

function mergePermissions(owner: NonNullable<Settings['permissions']>, kit: NonNullable<Settings['permissions']>) {
  const merged = { ...owner }
  for (const list of LISTS) {
    const have = merged[list] ?? []
    merged[list] = [...have, ...(kit[list] ?? []).filter(rule => !have.includes(rule))]
  }
  return merged
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
