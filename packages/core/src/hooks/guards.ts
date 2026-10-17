import { basename, resolve, sep } from 'node:path'

import { match } from 'ts-pattern'

import { nearestEnvironment, STATE_DIR } from '@nook/env/env.ts'
import { block, type HookInput, type HookResult, pass } from '@nook/shared/hook.ts'
import { ROLE_VAR } from '@nook/shared/names.ts'

import { SecretPolicy } from './secrets.ts'
import { plainWords } from './shell.ts'

/** The guards of the core: no secret reaches the model, no state or settings file changes by hand. Outside an environment they do nothing. */

const cwdOf = (input: HookInput) => input.cwd ?? process.cwd()
const inEnvironment = (input: HookInput) => nearestEnvironment(cwdOf(input)) !== null

/** PreToolUse Read, Grep, Glob. */
export function readGuard(input: HookInput): HookResult {
  if (!inEnvironment(input)) return pass
  const target = String(input.tool_input?.file_path ?? input.tool_input?.path ?? '')
  if (!target || !new SecretPolicy(cwdOf(input)).isSecretPath(target)) return pass
  return block(`${target} is a secret file: Nook does not read secrets. Ask the owner for the value you need, or use .env.example.`)
}

/** PreToolUse Bash: no secret, no state database, no role set by a command. */
const ROLE_SET = new RegExp(`\\b${ROLE_VAR}\\s*=`)

export function bashGuard(input: HookInput): HookResult {
  if (!inEnvironment(input)) return pass
  const policy = new SecretPolicy(cwdOf(input))
  const { plain, words } = plainWords(String(input.tool_input?.command ?? ''))
  for (const word of words) {
    const problem = policy.wordProblem(word)
    if (problem) return block(problem)
  }
  const listed = policy.listedIn(plain)
  if (listed) return block(`the command names ${listed}, a secret of nook.yml.`)
  if (ROLE_SET.test(plain) || /env\s+-u\s+CLAUDECODE/.test(plain)) return block('the role of an agent is set by nook, not by a command.')
  // a session that a tool starts could type /gate in place of the owner
  if (words.some(w => /(^|\/)claude$/.test(w)) && /(^|\s)\/(?:[\w-]+:)?gate(\s|$)/.test(plain)) return block('only the owner types /gate; an agent never starts a session that runs it.')
  return pass
}

type EditTarget = 'secret' | 'state' | 'settings' | 'free'

function editTarget(full: string): EditTarget {
  const name = basename(full)
  const parts = full.split(sep)
  if (/^\.env(\..+)?$/.test(name)) return 'secret'
  if (parts.includes(STATE_DIR)) return 'state'
  if (/^settings(\.local)?\.json$/.test(name) && parts.includes('.claude')) return 'settings'
  return 'free'
}

/** PreToolUse Edit, Write: no secret file, no state folder, no settings. */
export function editGuard(input: HookInput): HookResult {
  if (!inEnvironment(input)) return pass
  const target = String(input.tool_input?.file_path ?? '')
  if (!target) return pass
  return match(editTarget(resolve(cwdOf(input), target)))
    .with('secret', () => block(`${target} is a secret file: Nook never writes one.`))
    .with('state', () => block(`${target} is in the state folder: the nook commands write it, not an edit.`))
    .with('settings', () => block(`${target} holds the permissions: the owner edits it, or \`nook init --update\`.`))
    .with('free', () => pass)
    .exhaustive()
}
