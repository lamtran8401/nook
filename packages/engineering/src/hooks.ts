import { join, relative, resolve, sep } from 'node:path'

import { pluginDir } from '@kit/env/pack.ts'
import { block, context, hold, type HookInput, type HookResult, pass, rewrite } from '@kit/shared/hook.ts'

import { now, openDb, write } from './db.ts'
import { areaOf, dbFile, findHome, type Home } from './home.ts'
import type { Kit } from './kit.ts'
import { gaps, ownerStartedAuto } from './model/guards.ts'
import { findItem, type Item, listItems, OPEN_STATES } from './model/items.ts'
import { openBlocking } from './model/questions.ts'
import { liveSlices, runningSlices } from './model/slices.ts'
import { formatNext, next } from './report.ts'
import type { Role } from './role.ts'

/** The hooks of the pack (docs/engineering.md section 9). Outside a home every hook does nothing. */

export type Caller = { role: Role; actor: string; kind: 'lead' | 'builder' | 'verifier' | 'reviewer' | 'reader' }

/** No `agent_type` is the lead; a type that ends in `builder` is a builder; any other is a reader. */
export function callerOf(input: HookInput): Caller {
  if (!input.agent_type && !input.agent_id) return { role: 'lead', actor: 'lead', kind: 'lead' }
  // an agent with an id and no type is an in-process teammate: only builders run as teammates
  const type = input.agent_type ? (input.agent_type.split(':').pop() ?? input.agent_type) : 'teammate-builder'
  const actor = `${type}-${(input.agent_id ?? '').slice(-4) || '0000'}`
  if (type.endsWith('builder')) return { role: 'builder', actor, kind: 'builder' }
  const kind = type === 'verifier' ? 'verifier' : type === 'reviewer' ? 'reviewer' : 'reader'
  return { role: 'reader', actor, kind }
}

function kitFor(home: Home, caller: Caller, session?: string): Kit {
  return { home, db: openDb(dbFile(home)), who: { role: caller.role, actor: caller.actor, session: session ?? null } }
}

/** The words that the shell runs: heredoc bodies and comments are text. */
export function shellText(command: string): string {
  const kept: string[] = []
  let end: string | null = null
  for (const line of command.split('\n')) {
    if (end !== null) {
      if (line.trim() === end) end = null
      continue
    }
    const here = /<<-?\s*['"]?([A-Za-z_][\w-]*)['"]?/.exec(line)
    kept.push(line.replace(/(^|\s)#.*$/, ''))
    if (here) end = here[1] ?? null
  }
  return kept.join('\n')
}

/** `kit "item" appr\ove` reads as `kit item approve`. */
export const normalize = (text: string) => text.replace(/[\\'"]/g, '').replace(/[ \t]+/g, ' ')

const segments = (text: string) => text.split(/&&|\|\||[;|\n]/).map(s => s.trim()).filter(Boolean)
const words = (segment: string) => {
  const tokens = segment.split(/\s+/)
  while (tokens.length && /^[A-Za-z_]\w*=/.test(tokens[0]!)) tokens.shift()
  return tokens
}

const OWNER_MOVE = /\bkit(?:-eng|\s+eng|\s+engineering)\s+item\s+(approve|accept|mode)\b/
const WRAPPER = /(?:^|[\s;&|(`])(?:env|exec|xargs|eval|command|nohup|time|sudo|timeout|nice|stdbuf)\s+(?:\S+\s+)*kit(?:-eng)?(?:\s|$)/
const SHELL_C = /\b(?:sh|bash|zsh|dash)\s+-[a-z]*c\s+(?:\S+\s+)*kit(?:-eng)?(?:\s|$)/
const CODE_PATH = /(?:^|[\s/])(?:bin\/kit(?:-eng)?|(?:apps|packages)\/\S+\/src\/\S+|src\/main\.ts)(?:\s|$)|\bbun\s+(?:run\s+)?\S*\.ts\b/
const ROLE_ENV = /\bKIT_(?:ROLE|ACTOR|SESSION)\s*=|env\s+-u\s+CLAUDECODE/

/** PreToolUse Bash. */
export function bashGuard(input: HookInput): HookResult {
  const cwd = input.cwd ?? process.cwd()
  const home = findHome(cwd)
  if (!home) return pass
  const command = String(input.tool_input?.command ?? '')
  const plain = normalize(shellText(command))
  const owner = OWNER_MOVE.exec(plain)
  if (owner) return block(`${owner[1]} is the owner's move: tell the owner to run \`kit eng item ${owner[1]} <id>\` in a terminal.`)
  if (WRAPPER.test(plain) || SHELL_C.test(plain)) return block('run `kit eng` by its plain name: no env, exec, xargs, eval or sh -c around the tool.')
  if (CODE_PATH.test(plain)) return block('run `kit eng` by its plain name, not by a path to its code.')
  if (ROLE_ENV.test(plain)) return block('the role of an agent is set by the kit, not by a command.')
  const caller = callerOf(input)
  if (caller.role === 'reader') {
    const denied = readerDenial(plain, caller)
    if (denied) return block(denied)
  }
  const changed = inject(command, caller, input.session_id)
  return changed === command ? pass : rewrite({ ...(input.tool_input ?? {}), command: changed })
}

const READ_VERBS = new Set(['ls', 'cat', 'head', 'tail', 'wc', 'rg', 'grep', 'find', 'pwd', 'cd', 'echo', 'true', 'stat', 'file', 'tree', 'sort', 'uniq', 'diff', 'test', 'which'])
const GIT_READ = new Set(['status', 'diff', 'log', 'show'])
const CORE_READ = new Set(['doctor', 'packs', 'where', 'ste', 'help', '--help', '-h'])
const READ_CALLS = [
  ['item', 'show'], ['item', 'list'], ['item', 'history'], ['item', 'brief'], ['item', 'check'], ['item', 'ac', 'list'],
  ['task', 'list'], ['task', 'show'], ['task', 'brief'], ['questions'], ['guesses'], ['notes'], ['next'], ['area', 'list'], ['area', 'status'],
  ['adr', 'list'], ['brief'], ['doctor'], ['help'], ['--help'], ['-h'],
]
const EXTRA_CALLS: Partial<Record<Caller['kind'], string[][]>> = { verifier: [['task', 'prove'], ['item', 'verify']], reviewer: [['item', 'ac', 'done']] }

/** A reader runs read commands only: the reason when a segment is more than that. */
export function readerDenial(plain: string, caller: Caller): string | null {
  const who = caller.kind === 'reader' ? 'a reader' : `the ${caller.kind}`
  if (/\$\(|`/.test(plain)) return `${who} is read-only: no command substitution.`
  for (const segment of segments(plain)) {
    const tokens = words(segment)
    const verb = tokens[0]
    if (!verb) continue
    if (segment.replace(/\d?>&\d|\d?>>?\s*\/dev\/null/g, '').includes('>')) return `${who} is read-only: no output redirection.`
    if (verb === 'find' && /\s-(exec|delete|fprint|ok)\b/.test(segment)) return `${who} is read-only: find may not run or delete.`
    if (READ_VERBS.has(verb)) continue
    if (verb === 'git') {
      const sub = tokens.slice(1).find((t, i, all) => !t.startsWith('-') && all[i - 1] !== '-C')
      if (sub && GIT_READ.has(sub)) continue
      return `${who} may use only git status, diff, log and show.`
    }
    if (verb === 'kit' || verb === 'kit-eng') {
      const rest = tokens.slice(1).filter(t => !t.startsWith('--') || t === '--help')
      const inPack = verb === 'kit-eng' || rest[0] === 'eng' || rest[0] === 'engineering'
      if (!inPack) {
        if (!rest[0] || CORE_READ.has(rest[0])) continue
        return `${who} may run only the read commands of kit (doctor, packs, where).`
      }
      const path = verb === 'kit' ? rest.slice(1) : rest
      const allowed = [...READ_CALLS, ...(EXTRA_CALLS[caller.kind] ?? [])]
      if (!path.length || allowed.some(call => call.every((w, i) => path[i] === w))) continue
      return `${who} may not run \`kit eng ${path.slice(0, 3).join(' ')}\`: read commands only${EXTRA_CALLS[caller.kind] ? `, plus ${EXTRA_CALLS[caller.kind]!.map(c => c.join(' ')).join(' and ')}` : ''}.`
    }
    return `${who} is read-only: may not run \`${verb}\`.`
  }
  return null
}

const CALL_START = /(^|[;&|(\n]\s*|\b(?:then|do|else)\s+)(kit eng |kit engineering )/g

const ROLE_FLAGS = /\s--(?:as|actor|session)(?:=\S+|\s+\S+)/g

/**
 * The role, the actor and the session go into each call of the tool as flags, right after `kit eng`, so the
 * permission rule `Bash(kit eng *)` still matches. A flag that the model wrote is dropped first. The lead gets the session only.
 */
export function inject(command: string, caller: Caller, session?: string): string {
  const flags = caller.role === 'lead'
    ? (session ? `--session ${session} ` : '')
    : `--as ${caller.role} --actor ${caller.actor} --session ${session ?? '-'} `
  const clean = command.replace(ROLE_FLAGS, '')
  if (!flags) return clean
  return clean.replace(CALL_START, (_, before: string, call: string) => `${before}${call}${flags}`)
}

const FREE_DOCS = ['findings.md', 'handoff.md']

/** PreToolUse Edit, Write. */
export function editGuard(input: HookInput): HookResult {
  const cwd = input.cwd ?? process.cwd()
  const home = findHome(cwd)
  if (!home) return pass
  const target = String(input.tool_input?.file_path ?? input.tool_input?.notebook_path ?? '')
  if (!target) return pass
  const caller = callerOf(input)
  if (caller.role === 'reader') return block(`${caller.actor} is a reader: a reader never writes a file. Report what you found instead.`)
  const full = resolve(cwd, target)
  const kit = kitFor(home, caller, input.session_id)
  const work = join(home.dir, home.config.dir)
  const inWork = relative(work, full)
  if (inWork && !inWork.startsWith('..') && !inWork.startsWith(sep)) return documentRule(kit, caller, inWork.split(sep))
  const area = areaOf(home, full)
  if (!area) return pass
  const running = runningSlices(kit).filter(s => s.itemState === 'cooking' && s.area === area.name)
  if (!running.length) return block(`area ${area.name} has no item in cooking with a running slice: a file of an area changes inside a slice (kit eng task start <id> <T>).`)
  if (caller.role === 'builder' && !running.some(s => s.assignee === caller.actor)) return block(`${caller.actor}: a builder edits only in the area of its own slice; area ${area.name} runs ${running.map(s => `${s.item} ${s.id} (${s.assignee})`).join(', ')}.`)
  return pass
}

/** work/<id>/<name>: the frozen documents open in their stage only. */
function documentRule(kit: Kit, caller: Caller, parts: string[]): HookResult {
  const [id, name] = parts
  if (!id || !name || parts.length !== 2) return pass
  if (caller.role === 'builder') return block('a builder edits the files of its slice, not the documents of the item.')
  const item = findItem(kit, id)
  if (!item) return block(`no item ${id} in the ledger: kit eng item new ${id} "<title>" first.`)
  if (name === 'spec.md') return item.state === 'framing' ? pass : block(`${id} is ${item.state}: spec.md opens only in framing (kit eng item reframe ${id} --reason "<why>").`)
  if (name === 'plan.md' || name === 'tasks.md') return item.state === 'planning' ? pass : block(`${id} is ${item.state}: ${name} opens only in planning (kit eng item replan ${id} --reason "<why>").`)
  if (FREE_DOCS.includes(name) || name.startsWith('walkthrough.')) return pass
  return block(`${name} is not a document of ${id}: work/${id}/ holds spec.md, plan.md, tasks.md, findings.md, walkthrough.md and handoff.md.`)
}

export const MAX_HOLDS = 6
const pluginRoot = () => process.env.CLAUDE_PLUGIN_ROOT ?? pluginDir('engineering')
const skillFile = (stage: string) => `${pluginRoot()}/skills/${stage}/SKILL.md`

/** The item of a session: the recorded one, else the single item in an auto run. */
export function sessionItem(kit: Kit, session?: string): Item | null {
  const row = session ? (kit.db.query('SELECT item FROM session WHERE id = ?').get(session) as { item: string } | null) : null
  const recorded = row ? findItem(kit, row.item) : null
  if (recorded) return recorded
  const auto = listItems(kit).filter(i => i.mode === 'auto' && OPEN_STATES.includes(i.state))
  return auto.length === 1 ? auto[0]! : null
}

/** Why the lead stays: an open blocking question, or the next stage of an auto run that the owner started. */
export function holdReasons(kit: Kit, item: Item): string[] {
  const reasons: string[] = []
  const blocking = openBlocking(kit, item.id)
  if (blocking.length) reasons.push(`blocking question ${blocking.map(q => q.id).join(', ')} is open: ask the owner with AskUserQuestion, then \`kit eng answer ${item.id} ${blocking[0]!.id} "<answer>"\``)
  if (!ownerStartedAuto(kit, item)) return reasons
  const stage = autoStage(kit, item)
  if (stage) reasons.push(`auto run (the owner set mode auto): ${stage.note}read \`${skillFile(stage.skill)}\` and follow it for ${item.id}`)
  return reasons
}

function autoStage(kit: Kit, item: Item): { skill: string; note: string } | null {
  switch (item.state) {
    case 'backlog':
    case 'framing': return { skill: 'spec', note: '' }
    case 'planning': return gaps(kit, item, 'approve').length ? { skill: 'recipe', note: '' } : { skill: 'cook', note: `the plan is ready: run \`kit eng item proceed ${item.id}\`, then ` }
    case 'ready': return { skill: 'cook', note: '' }
    case 'cooking': {
      const live = liveSlices(kit, item.id)
      if (live.some(s => s.state === 'running')) return null
      if (live.length && live.every(s => s.state === 'done' || s.state === 'failed') && live.some(s => s.state === 'failed')) return null
      return { skill: 'cook', note: '' }
    }
    case 'checking': {
      const rejects = (kit.db.query("SELECT COUNT(*) AS n FROM event WHERE item = ? AND type = 'reject'").get(item.id) as { n: number }).n
      if (rejects >= 2 || !gaps(kit, item, 'accept').length) return null
      return { skill: 'check', note: '' }
    }
    default: return null
  }
}

/** Stop: hold the lead with the next stage, at most MAX_HOLDS times in one session. */
export function stopHook(input: HookInput): HookResult {
  const home = findHome(input.cwd ?? process.cwd())
  if (!home) return pass
  const session = input.session_id
  const kit = kitFor(home, { role: 'lead', actor: 'lead', kind: 'lead' }, session)
  const item = sessionItem(kit, session)
  if (!item || !OPEN_STATES.includes(item.state)) return pass
  const reasons = holdReasons(kit, item)
  if (!reasons.length) {
    if (session) write(kit.db, () => kit.db.run('UPDATE session SET holds = 0 WHERE id = ?', [session]))
    return pass
  }
  if (!session) return hold(`${item.id}: ${reasons.join('; ')}`)
  const holds = write(kit.db, () => {
    kit.db.run('INSERT INTO session (id, item, role, holds, seen_at) VALUES (?, ?, ?, 0, ?) ON CONFLICT(id) DO NOTHING', [session, item.id, 'lead', now()])
    const count = (kit.db.query('SELECT holds FROM session WHERE id = ?').get(session) as { holds: number }).holds
    // the cap: a stuck lead is let go after MAX_HOLDS holds in a row; stop_hook_active is true on every continuation
    kit.db.run('UPDATE session SET holds = ?, seen_at = ? WHERE id = ?', [count >= MAX_HOLDS ? 0 : count + 1, now(), session])
    return count
  })
  if (holds >= MAX_HOLDS) return pass
  return hold(`${item.id}: ${reasons.join('; ')} (hold ${holds + 1} of ${MAX_HOLDS})`)
}

/** SubagentStop: a builder finishes its slice before it ends. */
export function subagentStop(input: HookInput): HookResult {
  const home = findHome(input.cwd ?? process.cwd())
  if (!home) return pass
  const caller = callerOf(input)
  if (caller.role !== 'builder' || input.stop_hook_active) return pass
  const kit = kitFor(home, caller, input.session_id)
  const held = runningSlices(kit).filter(s => s.assignee === caller.actor)
  if (!held.length) return pass
  const s = held[0]!
  return hold(`finish the slice: \`kit eng task done ${s.item} ${s.id} --files <f...>\` or \`kit eng task wait ${s.item} ${s.id} --reason "<what you need>"\` (or task fail --reason after three tries)`)
}

/** TeammateIdle: a builder teammate named `<area>-builder` stays on a running slice of that area. Exit 2 keeps it working. */
export function teammateIdle(input: HookInput): HookResult {
  const home = findHome(input.cwd ?? process.cwd())
  if (!home) return pass
  const name = String(input.teammate_name ?? '')
  const area = /^(.+)-builder$/.exec(name)?.[1]
  if (!area) return pass
  const kit = kitFor(home, { role: 'lead', actor: 'lead', kind: 'lead' }, input.session_id)
  const held = runningSlices(kit).filter(s => s.area === area)
  if (!held.length) return pass
  const s = held[0]!
  return block(`${name} holds ${s.item} ${s.id} (running). Finish it: \`kit eng task done ${s.item} ${s.id} --files <f...>\`, or \`kit eng task wait ${s.item} ${s.id} --reason "<what you need>"\`, or task fail --reason after three tries.`)
}

/** SessionStart: the first lines of `kit eng next`. */
export function sessionStart(input: HookInput): HookResult {
  const home = findHome(input.cwd ?? process.cwd())
  if (!home) return pass
  const kit = kitFor(home, { role: 'lead', actor: 'lead', kind: 'lead' }, input.session_id)
  const lines = formatNext(next(kit)).split('\n').slice(0, 8)
  return context('SessionStart', `Engineering (${home.dir}):\n${lines.join('\n')}\nRun \`kit eng next\` for the full list, \`kit eng pickup <id>\` to take an item.`)
}
