import { resolve } from 'node:path'

/** The folder of the nook project: the repo that holds `apps/`, `packages/` and `plugins/`. */
export function projectRoot(): string {
  if (process.env.NOOK_PROJECT) return resolve(process.env.NOOK_PROJECT)
  return resolve(import.meta.dirname, '..', '..', '..')
}
