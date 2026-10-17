import { match } from 'ts-pattern'

import { pluginDir } from '@kit/env/pack.ts'
import { hold, type HookInput, type HookResult, pass } from '@kit/shared/hook.ts'

import { ownerStartedAuto } from '../guards/auto.ts'
import { Home } from '../home.ts'
import { isOpen } from '../machine.ts'
import { Engineering } from '../service.ts'
import type { Item } from '../stores/items.ts'
import { Caller, whoOf } from './caller.ts'

/** Stop: hold the lead on a blocking question, or on the next stage of an auto run that the owner started. */

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

/** The item that a session leads: its recorded item while it is the lead, else the single auto item that no session leads. */
export function sessionItem(eng: Engineering, session?: string): Item | null {
  const { sessions, items } = eng.stores
  const recordedId = session ? sessions.itemOf(session) : null
  const recorded = recordedId ? items.find(recordedId) : null
  if (recorded) return sessions.leaderOf(recorded.id) === session ? recorded : null
  const auto = items.list().filter(i => i.mode === 'auto' && isOpen(i.state) && !sessions.leaderOf(i.id))
  return auto.length === 1 ? auto[0]! : null
}

export function holdReasons(eng: Engineering, item: Item): string[] {
  const reasons: string[] = []
  const blocking = eng.stores.questions.openBlocking(item.id)
  if (blocking.length) {
    reasons.push(
      `blocking question ${blocking.map(q => q.id).join(', ')} is open: ask the owner with AskUserQuestion, then \`kit eng answer ${item.id} ${blocking[0]!.id} "<answer>"\``,
    )
  }
  if (!ownerStartedAuto(eng.stores, item)) return reasons
  const stage = autoStage(eng, item)
  if (stage)
    reasons.push(
      `auto run (the owner set mode auto): ${stage.note}read \`${skillFile(stage.skill)}\` and follow it for ${item.id}`,
    )
  return reasons
}

/** The next stage of the lead in an auto run, or null when the stage is a builder's or the owner's. */
function autoStage(eng: Engineering, item: Item): Stage | null {
  const plain = (skill: string): Stage => ({ skill, note: '' })
  return match(item.state)
    .with('backlog', 'framing', () => plain('spec'))
    .with('planning', () =>
      eng.gaps(item, 'approve').length
        ? plain('recipe')
        : { skill: 'cook', note: `the plan is ready: run \`kit eng item proceed ${item.id}\`, then ` },
    )
    .with('ready', () => plain('cook'))
    .with('cooking', () => cookingStage(eng, item))
    .with('review', () =>
      eng.stores.events.count(item.id, 'reject') >= MAX_REJECTS || !eng.gaps(item, 'accept').length
        ? null
        : plain('quality-check'),
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
