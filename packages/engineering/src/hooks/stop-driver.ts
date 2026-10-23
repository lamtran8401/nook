import { match } from 'ts-pattern'

import { pluginDir } from '@nook/workspace/workspaces.ts'
import { hold, type HookInput, type HookResult, pass } from '@nook/shared/hook.ts'

import { ownerStartedAuto } from '../guards/yolo.ts'
import { Home } from '../home.ts'
import { isOpen } from '../machine.ts'
import { Engineering } from '../service.ts'
import type { Item } from '../stores/items.ts'
import { Caller, whoOf } from './caller.ts'

/**
 * Stop: drive a yolo run that the owner started, one stage at a time. Any other stop passes: a question goes to the
 * owner by the rule, never by a hold.
 */

export const MAX_HOLDS = 6
const MAX_REJECTS = 2

const pluginRoot = () => process.env.CLAUDE_PLUGIN_ROOT ?? pluginDir()
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
  if (backgroundWorks(input)) return pass
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

/** The item that a session leads, while it is still the lead of it. A yolo item that no session leads holds nobody. */
export function sessionItem(eng: Engineering, session?: string): Item | null {
  const { sessions, items } = eng.stores
  const recordedId = session ? sessions.itemOf(session) : null
  const recorded = recordedId ? items.find(recordedId) : null
  return recorded && sessions.leaderOf(recorded.id) === session ? recorded : null
}

/** The next stage of a yolo run; none while a blocking question waits for the owner, who answers when back. */
export function holdReasons(eng: Engineering, item: Item): string[] {
  if (!ownerStartedAuto(eng.stores, item) || eng.stores.questions.openBlocking(item.id).length) return []
  const stage = autoStage(eng, item)
  if (!stage) return []
  return [`yolo run (the owner set mode yolo): nobody watches this run: record a guess with \`nook eng guess\` and never ask; ${stage.note}read \`${skillFile(stage.skill)}\` and follow it for ${item.id}`]
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
