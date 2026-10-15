import { Environment } from './environment.ts'

export type ActivePack = { name: string; home: Environment }

/**
 * The packs that are on in `from`: the union of every environment above it, in order.
 * A child that names a pack again becomes its home. A child can turn a pack of a parent off.
 */
export function activePacks(from = process.cwd()): ActivePack[] {
  const active = new Map<string, Environment>()
  for (const env of Environment.above(from)) {
    for (const name of env.config.off) active.delete(name)
    for (const name of env.config.packs) active.set(name, env)
  }
  return [...active].map(([name, home]) => ({ name, home }))
}
