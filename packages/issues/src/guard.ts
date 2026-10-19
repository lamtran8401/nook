import { basename } from 'node:path'

import { activePacks } from '@nook/desk/desks.ts'
import { block, pass, type HookInput, type HookResult } from '@nook/shared/hook.ts'
import { runCommand } from '@nook/shared/run.ts'
import { shellWords } from '@nook/shared/shell.ts'

/** The guard of the trackers: the agents of a desk read tickets and never write them, through `gh` or `twg`. */

export type TwgAccess = 'read' | 'write' | 'unknown'
/** One command of the map of twg: its words, each with its aliases, and its access. */
export type TwgCommand = { words: string[][]; access: TwgAccess }

const ASK = 'Ask the owner to do it.'
const writes = (command: string) => `${command} writes to the tracker: the agents of this desk only read tickets. ${ASK}`
const unsure = (command: string) => `the guard cannot tell whether ${command} writes to the tracker, so it blocks it. Ask the owner to run it.`

const WORD = '[a-z][\\w-]*'
const TOKEN = `${WORD}[*?]?`
// `group (alias): sub* sub`, also with ` — a description` after the group; the subcommands follow the last `: `
const GROUP_LINE = new RegExp(`^(.*?): ((?:${TOKEN} ?)+)$`)
const PATH_LINE = new RegExp(`^(${WORD}(?: ${WORD})*[*?]?)(?: — .*)?$`)

const accessOf = (token: string): TwgAccess => (token.endsWith('*') ? 'write' : token.endsWith('?') ? 'unknown' : 'read')
const bare = (token: string) => token.replace(/[*?]$/, '')

/** The words of a group head such as `assets objectschema (schema, schemas)`, with the aliases of its last word. */
function groupWords(head: string): string[][] {
  const group = head.split(' — ')[0]!.trim()
  if (group === '(top level)') return []
  const aliases = group.match(/\(([^)]*)\)/)?.[1]?.split(',').map(a => a.trim()) ?? []
  const words = group.replace(/\(.*\)/, '').trim().split(/\s+/).map(word => [word])
  words.at(-1)!.push(...aliases)
  return words
}

function parseLine(line: string): TwgCommand[] {
  const list = line.match(GROUP_LINE)
  if (list) return list[2]!.trim().split(' ').map(token => ({ words: [...groupWords(list[1]!), [bare(token)]], access: accessOf(token) }))
  const path = line.match(PATH_LINE)?.[1]
  return path ? [{ words: path.split(' ').map(word => [bare(word)]), access: accessOf(path) }] : []
}

/** An alias given on one line, such as `bitbucket (bb)`, holds on every line under that group. */
function spreadAliases(commands: TwgCommand[]): TwgCommand[] {
  const aliases = new Map<string, string[]>()
  for (const { words } of commands)
    words.forEach((names, i) => names.length > 1 && aliases.set(words.slice(0, i + 1).map(n => n[0]).join(' '), names))
  return commands.map(({ words, access }) => ({ access, words: words.map((names, i) => aliases.get(words.slice(0, i + 1).map(n => n[0]).join(' ')) ?? names) }))
}

/** The map that `twg help-map` prints under its `== … ==` headers: `*` marks a write, `?` an unknown access. */
export function parseTwgMap(text: string): TwgCommand[] {
  const lines = text.split('\n').map(line => line.trim())
  const first = lines.findIndex(line => /^== .+ ==$/.test(line))
  if (first < 0) return []
  return spreadAliases(lines.slice(first).filter(line => line && !line.startsWith('==')).flatMap(parseLine))
}

// the global options of twg that take a value; --output-summary takes one only when a level follows
const TWG_VALUE = new Set(['-s', '--site', '-o', '--output', '-p', '--profile', '-u', '--user', '--agent-fields', '--select', '--output-file', '--api-version', '--timeout-ms', '--output-shape'])
const SUMMARY_LEVEL = /^(none|stats|auto|inline)$/

/** The words of a twg call that can name its command: options and the values of the global ones left out. */
function twgWords(args: string[]): string[] {
  const words: string[] = []
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!
    if (!arg.startsWith('-')) words.push(arg)
    else if (TWG_VALUE.has(arg) || (arg === '--output-summary' && SUMMARY_LEVEL.test(args[i + 1] ?? ''))) i++
  }
  return words
}

/** The words that name a twg command: they are lowercase, and the first argument (a key, a path) is not. */
function commandName(words: string[]): string {
  const end = words.findIndex(word => !/^[a-z][a-z-]*$/.test(word))
  return `twg ${words.slice(0, end < 0 ? words.length : end).join(' ')}`
}

function twgVerdict(args: string[], map: TwgCommand[] | null): string | null {
  const words = twgWords(args)
  if (!words.length) return null
  const asked = commandName(words)
  if (!map) return `the guard could not read the command map of twg, so it blocks ${asked}. Ask the owner to run it.`
  const fits = (command: TwgCommand) => command.words.length <= words.length && command.words.every((names, i) => names.includes(words[i]!))
  const found = map.filter(fits).sort((a, b) => b.words.length - a.words.length)[0]
  if (!found) return unsure(asked)
  const named = `twg ${found.words.map(names => names[0]).join(' ')}`
  return found.access === 'read' ? null : found.access === 'write' ? writes(named) : unsure(named)
}

const GH_ISSUE_READS = new Set(['view', 'list', 'status'])
const GH_FIELDS = new Set(['-f', '-F', '--field', '--raw-field', '--input'])

/** The method of a gh api call, from -X, -XPOST, --method or --method=POST; GET when none is given. */
function apiMethod(args: string[]): string {
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!
    if (arg === '-X' || arg === '--method') return args[i + 1] ?? ''
    if (arg.startsWith('--method=')) return arg.slice('--method='.length)
    if (/^-X./.test(arg)) return arg.slice(2)
  }
  return 'GET'
}

const hasFields = (args: string[]) => args.some(arg => GH_FIELDS.has(arg) || /^--(field|raw-field|input)=/.test(arg) || /^-[fF]./.test(arg))

function ghVerdict(args: string[]): string | null {
  const plain = args.filter((arg, i) => !arg.startsWith('-') && !['-R', '--repo', '--hostname'].includes(args[i - 1] ?? ''))
  const [group, sub] = plain
  if (group === 'issue') return sub === undefined || GH_ISSUE_READS.has(sub) ? null : writes(`gh issue ${sub}`)
  if (group === 'api') return /^(get|head)$/i.test(apiMethod(args)) && !hasFields(args) ? null : writes('gh api with a write method or fields')
  return null
}

const PROGRAMS = new Set(['gh', 'twg'])

/**
 * The reason to block a command line, or null when it writes to no tracker. The words come from the shell parser of
 * shared, so a call inside `$(...)`, backticks, `eval` or `sh -c` counts too. Each call reads up to the next call.
 */
export function writeGuard(command: string, twgMap: () => TwgCommand[] | null): string | null {
  const words = shellWords(command)
  const calls = words.flatMap((word, i) => (PROGRAMS.has(basename(word)) ? [i] : []))
  for (const [n, at] of calls.entries()) {
    const args = words.slice(at + 1, calls[n + 1] ?? words.length)
    const reason = basename(words[at]!) === 'gh' ? ghVerdict(args) : twgVerdict(args, twgMap())
    if (reason) return reason
  }
  return null
}

/** The map of the twg on the path, or null when twg cannot print it. */
export function loadTwgMap(): TwgCommand[] | null {
  const run = runCommand(['twg', 'help-map'], { timeoutMs: 10_000 })
  if (run.code !== 0) return null
  const map = parseTwgMap(run.out)
  return map.length ? map : null
}

/** PreToolUse Bash: block a write to a tracker, only in a desk that turns the pack issue-tracker on. */
export function trackerHook(input: HookInput, twgMap: () => TwgCommand[] | null = loadTwgMap): HookResult {
  const command = input.tool_input?.command
  if (input.tool_name !== 'Bash' || typeof command !== 'string') return pass
  if (!activePacks(input.cwd ?? process.cwd()).some(pack => pack.name === 'issue-tracker')) return pass
  let map: TwgCommand[] | null | undefined
  const reason = writeGuard(command, () => (map === undefined ? (map = twgMap()) : map))
  return reason ? block(reason) : pass
}
