import { match } from 'ts-pattern'

import { TOOL } from '@nook/shared/names.ts'

import type { Caller, CallerKind } from './caller.ts'
import { segments, words } from './shell.ts'

/**
 * What a reader can run: shell reads, git reads and the read commands of the tool. A command that prints the
 * environment (env, printenv), writes or runs code (awk, sed, perl, python, node, xargs, tee) is never a read.
 */

const READ_VERBS = new Set([
  'ls',
  'cat',
  'head',
  'tail',
  'wc',
  'rg',
  'grep',
  'find',
  'pwd',
  'cd',
  'echo',
  'true',
  'stat',
  'file',
  'tree',
  'sort',
  'uniq',
  'diff',
  'test',
  '[',
  'read',
  'which',
  'type',
  'date',
  'sleep',
  'printf',
  'expr',
  'seq',
  'basename',
  'dirname',
  'realpath',
  'readlink',
  'du',
  'df',
  'whoami',
  'uname',
  'hostname',
  'id',
  'cut',
  'tr',
  'column',
  'nl',
  'tac',
  'comm',
  'cmp',
  'jq',
  'od',
  'xxd',
  'hexdump',
  'shasum',
  'sha256sum',
  'md5',
])
const GIT_READ = new Set(['status', 'diff', 'log', 'show', 'rev-parse', 'ls-files', 'ls-tree', 'blame', 'grep', 'merge-base', 'rev-list', 'describe', 'shortlog'])
const GIT_DENIAL = 'may use only the git reads: status, diff, log, show, branch to list, rev-parse, ls-files, ls-tree, blame, grep, merge-base, rev-list, describe and shortlog.'
// the flags of git branch that only list; each other flag can create, delete, move or track a branch
const BRANCH_LIST_FLAGS = /^(--show-current|--list|-l|-a|--all|-r|--remotes|-v|-vv|--verbose|-i|--ignore-case|--no-color|--color(=.*)?|--column(=.*)?|--no-column|--sort=.*|--format=.*|--abbrev=.*|--contains|--no-contains|--merged|--no-merged|--points-at)$/
const BRANCH_TAKES_COMMIT = new Set(['--contains', '--no-contains', '--merged', '--no-merged', '--points-at'])
// the words of shell structure: what follows them is the command, and `for x in …` lists words only
const KEYWORDS = new Set(['if', 'then', 'else', 'elif', 'while', 'until', 'do', '!', '{'])
const CLOSERS = new Set(['done', 'fi', 'esac', '}'])
const CORE_READ = new Set(['doctor', 'features', 'where', 'ste', 'help', '--help', '-h'])
const READ_CALLS = [
  ['item', 'show'],
  ['item', 'list'],
  ['item', 'history'],
  ['item', 'brief'],
  ['item', 'check'],
  ['item', 'page'],
  ['doc', 'page'],
  ['item', 'ac', 'list'],
  ['task', 'list'],
  ['task', 'show'],
  ['task', 'brief'],
  ['questions'],
  ['guesses'],
  ['notes'],
  ['next'],
  ['metrics'],
  ['kind', 'list'],
  ['area', 'list'],
  ['area', 'status'],
  ['adr', 'list'],
  ['brief'],
  ['doctor'],
  ['help'],
  ['--help'],
  ['-h'],
]

/** The write commands that one kind of reader may run as well. */
const extraCalls = (kind: CallerKind): string[][] =>
  match(kind)
    .with('verifier', () => [
      ['task', 'prove'],
      ['item', 'verify'],
    ])
    .with('reviewer', () => [['item', 'ac', 'done']])
    .with('lead', 'builder', 'reader', () => [])
    .exhaustive()

/** The reason to block a reader's command, or null when every segment of it only reads. */
export function readerDenial(plain: string, caller: Caller): string | null {
  const who = caller.kind === 'reader' ? 'a reader' : `the ${caller.kind}`
  if (/\$\(|`/.test(plain)) return `${who} is read-only: no command substitution.`
  for (const segment of segments(plain)) {
    const denied = segmentDenial(segment, caller.kind, who)
    if (denied) return denied
  }
  return null
}

function segmentDenial(segment: string, kind: CallerKind, who: string): string | null {
  const all = words(segment)
  const tokens = all.slice(Math.max(0, all.findIndex(token => !KEYWORDS.has(token))))
  const verb = KEYWORDS.has(tokens[0] ?? '') ? undefined : tokens[0]
  if (!verb || CLOSERS.has(verb) || verb === 'for') return null
  if (segment.replace(/\d?>&\d|\d?>>?\s*\/dev\/null/g, '').includes('>'))
    return `${who} is read-only: no output redirection.`
  if (verb === 'find' && /\s-(exec|delete|fprint|ok)\b/.test(segment))
    return `${who} is read-only: find may not run or delete.`
  if (READ_VERBS.has(verb)) return null
  if (verb === 'git') return gitDenial(tokens, who)
  if (verb === TOOL) return nookDenial(tokens, kind, who)
  return `${who} is read-only: may not run \`${verb}\`.`
}

function gitDenial(tokens: string[], who: string): string | null {
  const at = tokens.findIndex((t, i) => i > 0 && !t.startsWith('-') && tokens[i - 1] !== '-C')
  const sub = tokens[at]
  if (sub && GIT_READ.has(sub)) return null
  if (sub === 'branch' && branchLists(tokens.slice(at + 1))) return null
  return `${who} ${GIT_DENIAL}`
}

/** Whether a git branch call only lists: list flags only, and a name only as the commit of a filter or a pattern of --list. */
function branchLists(args: string[]): boolean {
  const listing = args.some(arg => arg === '--list' || arg === '-l')
  return args.every((arg, i) => (arg.startsWith('-') ? BRANCH_LIST_FLAGS.test(arg) : listing || BRANCH_TAKES_COMMIT.has(args[i - 1] ?? '')))
}

function nookDenial(tokens: string[], kind: CallerKind, who: string): string | null {
  const rest = tokens.slice(1).filter(t => !t.startsWith('--') || t === '--help')
  const inPack = rest[0] === 'eng' || rest[0] === 'engineering'
  if (!inPack)
    return !rest[0] || CORE_READ.has(rest[0])
      ? null
      : `${who} may run only the read commands of nook (doctor, features, where, ste, help).`
  const path = rest.slice(1)
  if ((path[0] === 'item' || path[0] === 'doc') && path[1] === 'page' && tokens.some(t => t.startsWith('--out')))
    return `${who} is read-only: \`${path[0]} page\` prints the page; --out writes a file.`
  const extra = extraCalls(kind)
  if (!path.length || [...READ_CALLS, ...extra].some(call => call.every((w, i) => path[i] === w))) return null
  const plus = extra.length ? `, plus ${extra.map(c => c.join(' ')).join(' and ')}` : ''
  return `${who} may not run \`nook eng ${path.slice(0, 3).join(' ')}\`: read commands only${plus}.`
}
