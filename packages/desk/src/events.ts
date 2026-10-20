import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import type { HookInput, HookResult } from '@nook/shared/hook.ts'
import { STATE_DIR } from '@nook/shared/names.ts'

import { Desk } from './desk.ts'

/** The event log of a desk: each block of a guard, each error of a hook and each prompt of the owner, so a retro finds the friction. */

export type DeskEvent = {
  at: string
  kind: 'block' | 'error' | 'prompt'
  session?: string
  hook?: string
  agent?: string
  tool?: string
  reason?: string
  command?: string
  text?: string
}

const LOG_DIR = 'events'
const COMMAND_CHARS = 200
const SECRET = '[secret]'

const TOKENS = [
  /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}/g,
  /\bgithub_pat_\w{20,}/g,
  /\bsk-[\w-]{20,}/g,
  /\bxox[abpr]-[\w-]{10,}/g,
  /\bAKIA[0-9A-Z]{16}\b/g,
  /\bATATT[\w=-]{20,}/g,
  /\beyJ[\w-]{10,}\.[\w-]{10,}\.[\w-]{10,}/g,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
]
const KEY_VALUE = /\b(password|passwd|secret|token|api[_-]?key)(\s*[:=]\s*)\S+/gi

/** The text with each token, private key and `password=…` value replaced by `[secret]`. */
export function maskSecrets(text: string): string {
  return TOKENS.reduce((masked, token) => masked.replace(token, SECRET), text).replace(KEY_VALUE, `$1$2${SECRET}`)
}

const logDir = (dir: string) => join(dir, STATE_DIR, LOG_DIR)
/** The local day of a time, such as 2026-10-20: the name of the file of the log that holds its events. */
const dayOf = (time: Date) => `${time.getFullYear()}-${String(time.getMonth() + 1).padStart(2, '0')}-${String(time.getDate()).padStart(2, '0')}`

/**
 * Appends one event to the file of its day in the log of the nearest desk above `cwd`, such as
 * `.nook/events/2026-10-20.jsonl`. A folder that is no desk keeps no log. Throws when the log cannot be written.
 */
export function recordEvent(cwd: string, event: Omit<DeskEvent, 'at'>, now = new Date()): void {
  const desk = Desk.nearest(cwd)
  if (!desk) return
  mkdirSync(logDir(desk.dir), { recursive: true })
  appendFileSync(join(logDir(desk.dir), `${dayOf(now)}.jsonl`), `${JSON.stringify({ at: now.toISOString(), ...event })}\n`)
}

/** What a call touches: the command of a shell call, or the file of an edit. */
const targetOf = (input: HookInput): string => String(input.tool_input?.command ?? input.tool_input?.file_path ?? '')

/** The recorder of one hook run: an error of the hook or a block becomes an event; a pass or a JSON answer writes nothing. */
export const hookRecorder =
  (input: HookInput, hook: string, now = new Date()) =>
  (result: HookResult, error?: Error): void => {
    if (!error && result.kind !== 'block') return
    recordEvent(
      input.cwd ?? process.cwd(),
      {
        kind: error ? 'error' : 'block',
        ...(input.session_id ? { session: input.session_id } : {}),
        hook,
        agent: input.agent_type ?? 'lead',
        ...(input.tool_name ? { tool: input.tool_name } : {}),
        reason: error ? error.message : result.kind === 'block' ? result.reason : '',
        command: maskSecrets(targetOf(input)).slice(0, COMMAND_CHARS),
      },
      now,
    )
  }

/** The events of the log of a desk, oldest first, of one kind and since a time when given; a broken line is skipped. */
export function readEvents(dir: string, filter: { kind?: DeskEvent['kind']; since?: Date } = {}): DeskEvent[] {
  const folder = logDir(dir)
  if (!existsSync(folder)) return []
  const first = filter.since ? `${dayOf(filter.since)}.jsonl` : ''
  return readdirSync(folder)
    .filter(name => name.endsWith('.jsonl') && name >= first)
    .sort()
    .flatMap(name => readFileSync(join(folder, name), 'utf8').split('\n'))
    .flatMap(line => {
      try {
        return line.trim() ? [JSON.parse(line) as DeskEvent] : []
      } catch {
        return []
      }
    })
    .filter(event => (!filter.kind || event.kind === filter.kind) && (!filter.since || new Date(event.at) >= filter.since))
}
