import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { STATE_DIR } from '@nook/desk/desks.ts'

/** `.nook/web.json` of a desk: the port and the process of its web server, never the token. */

export type WebState = { port: number; pid: number; started: string }

const fileOf = (desk: string) => join(desk, STATE_DIR, 'web.json')

export function readWebState(desk: string): WebState | null {
  const file = fileOf(desk)
  return existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as WebState) : null
}

export function writeWebState(desk: string, state: WebState): void {
  mkdirSync(join(desk, STATE_DIR), { recursive: true })
  writeFileSync(fileOf(desk), `${JSON.stringify(state, null, 2)}\n`)
}

export function removeWebState(desk: string): void {
  rmSync(fileOf(desk), { force: true })
}
