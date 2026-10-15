import { hold, type HookInput, type HookResult, pass } from '@kit/shared/hook.ts'

import { Home } from '../home.ts'
import { Engineering } from '../service.ts'
import { Caller, whoOf } from './caller.ts'

/** SubagentStop: a builder finishes its running slice before it ends. */
export function subagentStop(input: HookInput): HookResult {
  const home = Home.find(input.cwd ?? process.cwd())
  if (!home) return pass
  const caller = Caller.from(input)
  if (caller.role !== 'builder' || input.stop_hook_active) return pass
  const eng = Engineering.open(home, whoOf(caller, input.session_id))
  const s = eng.stores.slices.running().find(s => s.assignee === caller.actor)
  if (!s) return pass
  return hold(
    `finish the slice: \`kit eng task done ${s.item} ${s.id} --files <f...>\` or \`kit eng task wait ${s.item} ${s.id} --reason "<what you need>"\` (or task fail --reason after three tries)`,
  )
}
