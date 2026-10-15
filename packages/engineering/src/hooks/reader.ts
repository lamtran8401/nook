import { match } from 'ts-pattern'

import type { Caller, CallerKind } from './caller.ts'
import { segments, words } from './shell.ts'

/** What a reader can run: shell reads, git reads and the read commands of the tool. */

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
  'which',
])
const GIT_READ = new Set(['status', 'diff', 'log', 'show'])
const CORE_READ = new Set(['doctor', 'packs', 'where', 'ste', 'help', '--help', '-h'])
const READ_CALLS = [
  ['item', 'show'],
  ['item', 'list'],
  ['item', 'history'],
  ['item', 'brief'],
  ['item', 'check'],
  ['item', 'page'],
  ['item', 'ac', 'list'],
  ['task', 'list'],
  ['task', 'show'],
  ['task', 'brief'],
  ['questions'],
  ['guesses'],
  ['notes'],
  ['next'],
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
  const tokens = words(segment)
  const verb = tokens[0]
  if (!verb) return null
  if (segment.replace(/\d?>&\d|\d?>>?\s*\/dev\/null/g, '').includes('>'))
    return `${who} is read-only: no output redirection.`
  if (verb === 'find' && /\s-(exec|delete|fprint|ok)\b/.test(segment))
    return `${who} is read-only: find may not run or delete.`
  if (READ_VERBS.has(verb)) return null
  if (verb === 'git') return gitDenial(tokens, who)
  if (verb === 'kit' || verb === 'kit-eng') return kitDenial(verb, tokens, kind, who)
  return `${who} is read-only: may not run \`${verb}\`.`
}

function gitDenial(tokens: string[], who: string): string | null {
  const sub = tokens.slice(1).find((t, i, all) => !t.startsWith('-') && all[i - 1] !== '-C')
  return sub && GIT_READ.has(sub) ? null : `${who} may use only git status, diff, log and show.`
}

function kitDenial(verb: string, tokens: string[], kind: CallerKind, who: string): string | null {
  const rest = tokens.slice(1).filter(t => !t.startsWith('--') || t === '--help')
  const inPack = verb === 'kit-eng' || rest[0] === 'eng' || rest[0] === 'engineering'
  if (!inPack)
    return !rest[0] || CORE_READ.has(rest[0])
      ? null
      : `${who} may run only the read commands of kit (doctor, packs, where).`
  const path = verb === 'kit' ? rest.slice(1) : rest
  if (path[0] === 'item' && path[1] === 'page' && tokens.some(t => t.startsWith('--out')))
    return `${who} is read-only: \`item page\` prints the page; --out writes a file.`
  const extra = extraCalls(kind)
  if (!path.length || [...READ_CALLS, ...extra].some(call => call.every((w, i) => path[i] === w))) return null
  const plus = extra.length ? `, plus ${extra.map(c => c.join(' ')).join(' and ')}` : ''
  return `${who} may not run \`kit eng ${path.slice(0, 3).join(' ')}\`: read commands only${plus}.`
}
