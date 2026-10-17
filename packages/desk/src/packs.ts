import { Desk } from './desk.ts'

export type ActivePack = { name: string; home: Desk }

/**
 * The packs that are on in `from`: the union of every desk above it, in order.
 * A child that names a pack again becomes its home. A child can turn a pack of a parent off.
 */
export function activePacks(from = process.cwd()): ActivePack[] {
  const active = new Map<string, Desk>()
  for (const desk of Desk.above(from)) {
    for (const name of desk.config.off) active.delete(name)
    for (const name of desk.config.packs) active.set(name, desk)
  }
  return [...active].map(([name, home]) => ({ name, home }))
}
