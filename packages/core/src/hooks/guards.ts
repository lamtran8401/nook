import { basename, resolve, sep } from 'node:path'

import { match } from 'ts-pattern'

import { desksAbove, nearestDesk, STATE_DIR } from '@nook/desk/desks.ts'
import { SecretPolicy } from '@nook/desk/secrets.ts'
import { block, type HookInput, type HookResult, pass } from '@nook/shared/hook.ts'
import { ROLE_VAR } from '@nook/shared/names.ts'

import { readWebState } from '../web/web-state.ts'
import { plainWords, shellWords } from '@nook/shared/shell.ts'

/** The guards of the core: no secret reaches the model, no state or settings file changes by hand. Outside a desk they do nothing. */

const cwdOf = (input: HookInput) => input.cwd ?? process.cwd()
const inDesk = (input: HookInput) => nearestDesk(cwdOf(input)) !== null

/** PreToolUse Read, Grep, Glob. */
export function readGuard(input: HookInput): HookResult {
  if (!inDesk(input)) return pass
  const target = String(input.tool_input?.file_path ?? input.tool_input?.path ?? '')
  if (!target || !new SecretPolicy(cwdOf(input)).isSecretPath(target)) return pass
  return block(`${target} is a secret file: Nook does not read secrets. Ask the owner for the value you need, or use .env.example.`)
}

/** PreToolUse Bash: no secret, no state database, no role set by a command. */
const ROLE_SET = new RegExp(`\\b${ROLE_VAR}\\s*=`)
const STATE_DB = /(^|\/)\.nook\/.*\.db/
const SQLITE = /(^|\/)sqlite3?$/
// the spellings of this machine: 127.x and its short forms, localhost, 0.0.0.0 or 0, ::1, the IPv4 form of IPv6, the decimal form
const LOCAL = String.raw`(?:127(?:\.\d{1,3}){0,3}|localhost\.?|0\.0\.0\.0|0|\[::1\]|\[::ffff:127(?:\.\d{1,3}){3}\]|2130706433)`
const NOOK = /(^|\/)(?:nook|nk)$/
const BROKEN_STATE = '.nook/web.json is broken, so the port of the web app is unknown. Ask the owner to stop nook web and delete .nook/web.json.'

/** The ports of the web apps that run for the desks above the folder, from their `.nook/web.json`; null when one cannot be read. */
function webPorts(cwd: string): number[] | null {
  try {
    return desksAbove(cwd).flatMap(desk => readWebState(desk.dir)?.port ?? [])
  } catch {
    return null
  }
}

/** A call to the port on this machine: host and port joined by `:`, `/` or a space, as in curl, /dev/tcp or nc. */
const callsPort = (plain: string, port: number) => new RegExp(String.raw`(?<![\w.])${LOCAL}(?::|/|\s+)${port}(?!\d)`, 'i').test(plain)

export function bashGuard(input: HookInput): HookResult {
  if (!inDesk(input)) return pass
  const policy = new SecretPolicy(cwdOf(input))
  const command = String(input.tool_input?.command ?? '')
  const { plain, words } = plainWords(command)
  for (const word of words) {
    const problem = policy.wordProblem(word)
    if (problem) return block(problem)
  }
  const shell = shellWords(command)
  if (words.some(w => STATE_DB.test(w)) || shell.some(word => SQLITE.test(word)))
    return block('the state databases are not for the shell: use the nook commands.')
  if (shell.some((word, i) => NOOK.test(word) && shell[i + 1] === 'web')) return block('only the owner starts the web app, in a terminal: an agent never runs nook web.')
  const ports = webPorts(cwdOf(input))
  if (ports === null) return block(BROKEN_STATE)
  if (ports.some(port => callsPort(plain, port))) return block('the web app belongs to the owner: an agent never calls its port. Read the desk with the nook commands.')
  const listed = policy.listedIn(plain)
  if (listed) return block(`the command names ${listed}, a secret of nook.yml.`)
  if (ROLE_SET.test(plain) || /env\s+-u\s+CLAUDECODE/.test(plain)) return block('the role of an agent is set by nook, not by a command.')
  // a session that a tool starts could type /gate in place of the owner
  if (words.some(w => /(^|\/)claude$/.test(w)) && /(^|\s)\/(?:[\w-]+:)?gate(\s|$)/.test(plain)) return block('only the owner types /gate; an agent never starts a session that runs it.')
  return pass
}

type EditTarget = 'state' | 'settings' | 'free'

function editTarget(full: string): EditTarget {
  const name = basename(full)
  const parts = full.split(sep)
  if (parts.includes(STATE_DIR)) return 'state'
  if (/^settings(\.local)?\.json$/.test(name) && parts.includes('.claude')) return 'settings'
  return 'free'
}

/** PreToolUse Edit, Write: no secret file, no state folder, no settings. */
export function editGuard(input: HookInput): HookResult {
  if (!inDesk(input)) return pass
  const target = String(input.tool_input?.file_path ?? '')
  if (!target) return pass
  if (new SecretPolicy(cwdOf(input)).isSecretPath(target)) return block(`${target} is a secret file: Nook never writes one.`)
  return match(editTarget(resolve(cwdOf(input), target)))
    .with('state', () => block(`${target} is in the state folder: the nook commands write it, not an edit.`))
    .with('settings', () => block(`${target} holds the permissions: the owner edits it, or \`nook init --update\`.`))
    .with('free', () => pass)
    .exhaustive()
}
