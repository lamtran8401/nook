import { hold, type HookInput, type HookResult, pass } from '@nook/shared/hook.ts'

import { Home } from '../home.ts'
import { Engineering } from '../service.ts'
import { Caller, whoOf } from './caller.ts'
import { sessionItem } from './stop-driver.ts'

/** SubagentStop: an agent that ends is logged on the item of its session, and a builder finishes its running slice first. */
export function subagentStop(input: HookInput): HookResult {
  const home = Home.find(input.cwd ?? process.cwd())
  if (!home) return pass
  const caller = Caller.from(input)
  const eng = Engineering.open(home, whoOf(caller, input.session_id))
  if (!input.stop_hook_active) logAgent(eng, caller, input)
  if (caller.role !== 'builder' || input.stop_hook_active) return pass
  const s = eng.stores.slices.running().find(s => s.assignee === caller.actor)
  if (!s) return pass
  return hold(
    `finish the slice: \`nook eng task done ${s.item} ${s.id} --files <f...>\` or \`nook eng task wait ${s.item} ${s.id} --reason "<what you need>"\` (or task fail --reason after three tries)`,
  )
}

/** One `agent` event for each agent that worked on the item, so the page counts them against the budget. */
function logAgent(eng: Engineering, caller: Caller, input: HookInput): void {
  const item = sessionItem(eng, input.session_id)
  if (!item || caller === Caller.lead) return
  const { events } = eng.stores
  if (events.history(item.id).some(e => e.type === 'agent' && e.actor === caller.actor)) return
  const name = String(input.agent_type ?? 'teammate').split(':').pop()
  eng.ledger.write(() => events.record(item.id, 'agent', { reason: name }))
}
