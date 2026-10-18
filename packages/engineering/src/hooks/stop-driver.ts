import { match } from 'ts-pattern'

import { pluginDir } from '@nook/desk/pack.ts'
import { hold, type HookInput, type HookResult, pass } from '@nook/shared/hook.ts'

import { ownerStartedAuto } from '../guards/yolo.ts'
import { Home } from '../home.ts'
import { isOpen } from '../machine.ts'
import { Engineering } from '../service.ts'
import type { Item } from '../stores/items.ts'
import { Caller, whoOf } from './caller.ts'

/**
 * Stop: hold the lead on a blocking question, on an answer that came while a slice waits, or on the next stage of a
 * yolo run that the owner started.
 */

export const MAX_HOLDS = 6
const MAX_REJECTS = 2

const pluginRoot = () => process.env.CLAUDE_PLUGIN_ROOT ?? pluginDir('engineering')
const skillFile = (stage: string) => `${pluginRoot()}/skills/${stage}/SKILL.md`

type Stage = { skill: string; note: string }

export function stopDriver(input: HookInput): HookResult {
  const home = Home.find(input.cwd ?? process.cwd())
  if (!home) return pass
  const session = input.session_id
  const eng = Engineering.open(home, whoOf(Caller.lead, session))
  const item = sessionItem(eng, session)
  if (!item || !isOpen(item.state)) return pass
  const reasons = holdReasons(eng, item)
  if (!reasons.length) {
    if (session) eng.ledger.write(() => eng.stores.sessions.resetHolds(session))
    return pass
  }
  if (backgroundWorks(input) && !eng.stores.questions.openBlocking(item.id).length) return pass
  if (!session) return hold(`${item.id}: ${reasons.join('; ')}`)
  const holds = countHold(eng, session, item.id)
  if (holds >= MAX_HOLDS) return pass
  return hold(`${item.id}: ${reasons.join('; ')} (hold ${holds + 1} of ${MAX_HOLDS})`)
}

// Only a known running word counts: an unknown word means one more hold, never a run that nobody pushes on.
const RUNNING = /^(running|pending|queued|starting|in_progress)$/

/** A background task that still runs wakes the lead when it reports, so a hold now only repeats "still running". */
function backgroundWorks(input: HookInput): boolean {
  const tasks = Array.isArray(input.background_tasks) ? (input.background_tasks as { status?: unknown }[]) : []
  return tasks.some(task => RUNNING.test(String(task.status ?? '')))
}

/** The holds before this one. A stuck lead is let go after MAX_HOLDS in a row, until a move of the item starts the count again. */
function countHold(eng: Engineering, session: string, item: string): number {
  const sessions = eng.stores.sessions
  return eng.ledger.write(() => {
    sessions.ensure(session, item)
    const count = sessions.holds(session)
    if (count < MAX_HOLDS) sessions.setHolds(session, count + 1)
    return count
  })
}

/** The item that a session leads: its recorded item while it is the lead, else the single yolo item that no session leads. */
export function sessionItem(eng: Engineering, session?: string): Item | null {
  const { sessions, items } = eng.stores
  const recordedId = session ? sessions.itemOf(session) : null
  const recorded = recordedId ? items.find(recordedId) : null
  if (recorded) return sessions.leaderOf(recorded.id) === session ? recorded : null
  const yolo = items.list().filter(i => i.mode === 'yolo' && isOpen(i.state) && !sessions.leaderOf(i.id))
  return yolo.length === 1 ? yolo[0]! : null
}

export function holdReasons(eng: Engineering, item: Item): string[] {
  const reasons: string[] = []
  const blocking = eng.stores.questions.openBlocking(item.id)
  if (blocking.length) {
    reasons.push(
      `blocking question ${blocking.map(q => q.id).join(', ')} is open: ask the owner with AskUserQuestion, then \`nook eng answer ${item.id} ${blocking[0]!.id} "<answer>"\``,
    )
  }
  reasons.push(...answersWhileWaiting(eng, item))
  if (!ownerStartedAuto(eng.stores, item)) return reasons
  const stage = autoStage(eng, item)
  if (stage)
    reasons.push(
      `yolo run (the owner set mode yolo): ${stage.note}read \`${skillFile(stage.skill)}\` and follow it for ${item.id}`,
    )
  return reasons
}

const ANSWERED = /^Q\d+ answered: /

/**
 * A slice that waits, and an answer recorded after it began to wait, such as one the owner gave on the page of the
 * item: the lead hears of it at its next stop and goes on with no restart. A new wait or a resume ends the hold.
 */
function answersWhileWaiting(eng: Engineering, item: Item): string[] {
  const history = eng.stores.events.history(item.id)
  return eng.stores.slices.list(item.id).flatMap(slice => {
    if (slice.state !== 'waiting') return []
    const waited = history.findLast(e => e.type === 'task' && e.to_state === 'waiting' && e.reason?.startsWith(`${slice.id} `))
    const answers = history.filter(e => waited && e.id > waited.id && e.type === 'question' && ANSWERED.test(e.reason ?? ''))
    if (!answers.length) return []
    return [`${slice.id} waits, and since then ${answers.map(a => a.reason).join('; ')}: resume it with \`nook eng task resume ${item.id} ${slice.id}\` when this unblocks it, or wait again with a new reason`]
  })
}

/** The next stage of the lead in a yolo run, or null when the stage is a builder's or the owner's. */
function autoStage(eng: Engineering, item: Item): Stage | null {
  const plain = (skill: string): Stage => ({ skill, note: '' })
  return match(item.state)
    .with('backlog', 'framing', () => plain('spec'))
    .with('planning', () =>
      eng.gaps(item, 'approve').length
        ? plain('recipe')
        : { skill: 'cook', note: `the plan is ready: run \`nook eng item proceed ${item.id}\`, then ` },
    )
    .with('ready', () => plain('cook'))
    .with('cooking', () => cookingStage(eng, item))
    .with('review', () =>
      eng.stores.events.count(item.id, 'reject') >= MAX_REJECTS || !eng.gaps(item, 'accept').length
        ? null
        : plain('deep-review'),
    )
    .with('done', 'blocked', 'cancelled', () => null)
    .exhaustive()
}

/** While a slice runs, the builders work; when every slice ended and one failed, the owner decides. */
function cookingStage(eng: Engineering, item: Item): Stage | null {
  const live = eng.stores.slices.live(item.id)
  if (live.some(s => s.state === 'running')) return null
  const ended = live.length && live.every(s => s.state === 'done' || s.state === 'failed')
  if (ended && live.some(s => s.state === 'failed')) return null
  return { skill: 'cook', note: '' }
}
