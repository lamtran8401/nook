import { block, type HookInput, type HookResult, pass, rewrite } from '@kit/shared/hook.ts'

import { Home } from '../home.ts'
import { Caller } from './caller.ts'
import { readerDenial } from './reader.ts'
import { callSpans, commands, commandWords, normalize, shellText, type Word } from './shell.ts'

/** PreToolUse Bash: owner moves stay the owner's, the tool runs by its name, each call names its caller. */

const OWNER_MOVE = /\bkit(?:-eng|\s+eng|\s+engineering)\s+item\s+(approve|accept|mode)\b/
const WRAPPER =
  /(?:^|[\s;&|(`])(?:env|exec|xargs|eval|command|nohup|time|sudo|timeout|nice|stdbuf)\s+(?:\S+\s+)*kit(?:-eng)?(?:\s|$)/
const SHELL_C = /\b(?:sh|bash|zsh|dash)\s+-[a-z]*c\s+(?:\S+\s+)*kit(?:-eng)?(?:\s|$)/
const CODE_PATH =
  /(?:^|[\s/])(?:bin\/kit(?:-eng)?|(?:apps|packages)\/\S+\/src\/\S+|src\/main\.ts)(?:\s|$)|\bbun\s+(?:run\s+)?\S*\.ts\b/
const ROLE_ENV = /\bKIT_(?:ROLE|ACTOR|SESSION)\s*=|env\s+-u\s+CLAUDECODE/

const ROLE_FLAGS = /\s--(?:as|actor|session)(?:=\S+|\s+\S+)/g

export function bashGuard(input: HookInput): HookResult {
  if (!Home.find(input.cwd ?? process.cwd())) return pass
  const command = String(input.tool_input?.command ?? '')
  const plain = normalize(shellText(command))
  const denied = denial(command)
  if (denied) return block(denied)
  const caller = Caller.from(input)
  const readOnly = caller.role === 'reader' ? readerDenial(plain, caller) : null
  if (readOnly) return block(readOnly)
  const changed = inject(command, caller, input.session_id)
  return changed === command ? pass : rewrite({ ...(input.tool_input ?? {}), command: changed })
}

const OWNER_TEXT = (move: string) => `${move} is the owner's move: tell the owner to run \`kit eng item ${move} <id>\` in a terminal.`
const WRAP_TEXT = 'run `kit eng` by its plain name: no env, exec, xargs, eval or sh -c around the tool.'
const CODE_TEXT = 'run `kit eng` by its plain name, not by a path to its code.'
const ROLE_TEXT = 'the role of an agent is set by the kit, not by a command.'

const WRAPPERS = new Set(['env', 'exec', 'xargs', 'eval', 'command', 'nohup', 'time', 'sudo', 'timeout', 'nice', 'stdbuf'])
const SHELLS = new Set(['sh', 'bash', 'zsh', 'dash'])
const OWNER_MOVES = new Set(['approve', 'accept', 'mode'])
const ROLE_SET = /^KIT_(?:ROLE|ACTOR|SESSION)=/
const isTool = (word: string) => word === 'kit' || word === 'kit-eng'

/** The reason to block a command line, or null. Only command words count: a quoted string is one argument. */
function denial(command: string): string | null {
  const text = shellText(command)
  const parsed = commands(text)
  for (const words of parsed) {
    const reason = commandDenial(words)
    if (reason) return reason
  }
  // a shell that reads its commands from a heredoc or a pipe runs the text that shellText drops
  if (parsed.some(words => readsStdin(commandWords(words).map(w => w.text)))) {
    for (const words of commands(command)) {
      const reason = commandDenial(words)
      if (reason) return reason
    }
  }
  // code inside $( ) or backticks runs too, so it is read the strict way
  for (const inner of substitutions(text)) {
    const reason = strictDenial(normalize(inner))
    if (reason) return reason
  }
  return null
}

function commandDenial(all: Word[]): string | null {
  if (all.some(w => !w.quoted && ROLE_SET.test(w.text))) return ROLE_TEXT
  const words = commandWords(all).map(w => w.text)
  const [head, ...rest] = words
  if (!head) return null
  if (head === 'unset' && rest.includes('CLAUDECODE')) return ROLE_TEXT
  if (head === 'env' && rest.includes('CLAUDECODE')) return ROLE_TEXT
  if (WRAPPERS.has(head) && rest.some(isTool)) return WRAP_TEXT
  if (SHELLS.has(head) && shellCode(rest).some(code => /(^|[\s;&|(])kit(-eng)?(\s|$)/.test(code))) return WRAP_TEXT
  if (runsKitCode(head, rest)) return CODE_TEXT
  const move = ownerMove(head, rest)
  return move ? OWNER_TEXT(move) : null
}

/** `kit eng item approve`, `kit engineering item accept`, `kit-eng item mode`. */
function ownerMove(head: string, rest: string[]): string | null {
  const path = head === 'kit' && (rest[0] === 'eng' || rest[0] === 'engineering') ? rest.slice(1) : head === 'kit-eng' ? rest : null
  const args = path?.filter(w => !w.startsWith('--')) ?? []
  return args[0] === 'item' && OWNER_MOVES.has(args[1] ?? '') ? args[1]! : null
}

/** The code that `sh -c '...'` runs. */
const shellCode = (rest: string[]) => rest.flatMap((w, i) => (/^-[a-z]*c[a-z]*$/.test(w) && rest[i + 1] ? [rest[i + 1]!] : []))

/** A shell with no script and no -c reads its commands from stdin; a redirection is not a script. */
const readsStdin = ([head, ...rest]: string[]) =>
  !!head && SHELLS.has(head) && !rest.some(w => !w.startsWith('-') && !/^\d*[<>]/.test(w))

const KIT_SOURCE = /(^|\/)(apps|packages)\/\S+\.ts$|(^|\/)src\/main\.ts$/

/** A run of the tool by a path to its launcher, or of its source through bun. */
function runsKitCode(head: string, rest: string[]): boolean {
  if (/(^|\/)bin\/kit(-eng)?$/.test(head) || KIT_SOURCE.test(head)) return true
  if (head !== 'bun') return false
  const script = rest.filter(w => !w.startsWith('-') && w !== 'run')[0] ?? ''
  return KIT_SOURCE.test(script)
}

/** The text inside each `$( )` and each pair of backticks. */
function substitutions(text: string): string[] {
  const found: string[] = []
  for (const m of text.matchAll(/`([^`]*)`/g)) found.push(m[1]!)
  for (let i = text.indexOf('$('); i >= 0; i = text.indexOf('$(', i + 2)) {
    let depth = 0
    for (let j = i + 1; j < text.length; j++) {
      if (text[j] === '(') depth++
      else if (text[j] === ')' && --depth === 0) {
        found.push(text.slice(i + 2, j))
        break
      }
    }
  }
  return found
}

function strictDenial(plain: string): string | null {
  const owner = OWNER_MOVE.exec(plain)
  if (owner) return OWNER_TEXT(owner[1]!)
  if (WRAPPER.test(plain) || SHELL_C.test(plain)) return WRAP_TEXT
  if (CODE_PATH.test(plain)) return CODE_TEXT
  if (ROLE_ENV.test(plain)) return ROLE_TEXT
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
  let out = command
  // from the last call to the first, so the earlier positions stay right
  for (const span of callSpans(command).reverse()) {
    const args = out.slice(span.prefixEnd, span.end).replace(/^/, ' ').replace(ROLE_FLAGS, '').replace(/^ /, '')
    out = out.slice(0, span.prefixEnd) + flags + args + out.slice(span.end)
  }
  return out
}
