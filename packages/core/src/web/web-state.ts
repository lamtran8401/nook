import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { STATE_DIR } from '@nook/workspace/workspaces.ts'

/** `.nook/web.json` of a workspace: the port of its web server, kept after a stop, and the process while it runs. */

export type WebState = { port: number; pid?: number; started?: string }

const fileOf = (workspace: string) => join(workspace, STATE_DIR, 'web.json')

export function readWebState(workspace: string): WebState | null {
  const file = fileOf(workspace)
  return existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as WebState) : null
}

export function writeWebState(workspace: string, state: WebState): void {
  mkdirSync(join(workspace, STATE_DIR), { recursive: true })
  writeFileSync(fileOf(workspace), `${JSON.stringify(state, null, 2)}\n`)
}
