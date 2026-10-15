import { block, type HookInput, type HookResult, pass, rewrite } from '@kit/shared/hook.ts'

import { Home } from '../home.ts'
import { Caller } from './caller.ts'
import { readerDenial } from './reader.ts'
import { normalize, shellText } from './shell.ts'

/** PreToolUse Bash: owner moves stay the owner's, the tool runs by its name, each call names its caller. */

const OWNER_MOVE = /\bkit(?:-eng|\s+eng|\s+engineering)\s+item\s+(approve|accept|mode)\b/
const WRAPPER =
  /(?:^|[\s;&|(`])(?:env|exec|xargs|eval|command|nohup|time|sudo|timeout|nice|stdbuf)\s+(?:\S+\s+)*kit(?:-eng)?(?:\s|$)/
const SHELL_C = /\b(?:sh|bash|zsh|dash)\s+-[a-z]*c\s+(?:\S+\s+)*kit(?:-eng)?(?:\s|$)/
const CODE_PATH =
  /(?:^|[\s/])(?:bin\/kit(?:-eng)?|(?:apps|packages)\/\S+\/src\/\S+|src\/main\.ts)(?:\s|$)|\bbun\s+(?:run\s+)?\S*\.ts\b/
const ROLE_ENV = /\bKIT_(?:ROLE|ACTOR|SESSION)\s*=|env\s+-u\s+CLAUDECODE/

const CALL_START = /(^|[;&|(\n]\s*|\b(?:then|do|else)\s+)(kit eng |kit engineering )/g
const ROLE_FLAGS = /\s--(?:as|actor|session)(?:=\S+|\s+\S+)/g

export function bashGuard(input: HookInput): HookResult {
  if (!Home.find(input.cwd ?? process.cwd())) return pass
  const command = String(input.tool_input?.command ?? '')
  const plain = normalize(shellText(command))
  const denied = denial(plain)
  if (denied) return block(denied)
  const caller = Caller.from(input)
  const readOnly = caller.role === 'reader' ? readerDenial(plain, caller) : null
  if (readOnly) return block(readOnly)
  const changed = inject(command, caller, input.session_id)
  return changed === command ? pass : rewrite({ ...(input.tool_input ?? {}), command: changed })
}

function denial(plain: string): string | null {
  const owner = OWNER_MOVE.exec(plain)
  if (owner)
    return `${owner[1]} is the owner's move: tell the owner to run \`kit eng item ${owner[1]} <id>\` in a terminal.`
  if (WRAPPER.test(plain) || SHELL_C.test(plain))
    return 'run `kit eng` by its plain name: no env, exec, xargs, eval or sh -c around the tool.'
  if (CODE_PATH.test(plain)) return 'run `kit eng` by its plain name, not by a path to its code.'
  if (ROLE_ENV.test(plain)) return 'the role of an agent is set by the kit, not by a command.'
  return null
}

/**
 * Puts the role, the actor and the session right after `kit eng` in each call,
 * so the rule `Bash(kit eng *)` still matches. A flag that the model wrote is dropped first.
 * The lead gets the session only.
 */
export function inject(command: string, caller: Caller, session?: string): string {
  const flags =
    caller.role === 'lead'
      ? session
        ? `--session ${session} `
        : ''
      : `--as ${caller.role} --actor ${caller.actor} --session ${session ?? '-'} `
  const clean = command.replace(ROLE_FLAGS, '')
  if (!flags) return clean
  return clean.replace(CALL_START, (_, before: string, call: string) => `${before}${call}${flags}`)
}
