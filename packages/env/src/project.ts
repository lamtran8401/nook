import { resolve } from 'node:path'

/** The folder of the kit project: the repo that holds `apps/`, `packages/` and `plugins/`. */
export function projectRoot(): string {
  if (process.env.KIT_PROJECT) return resolve(process.env.KIT_PROJECT)
  return resolve(import.meta.dir, '..', '..', '..')
}
