import { block, type HookInput, type HookResult, pass } from '@kit/shared/hook.ts'

import { Home } from '../home.ts'
import { Engineering } from '../service.ts'
import { Caller, whoOf } from './caller.ts'

/**
 * TeammateIdle: a teammate named `<area>-builder` stays on a running slice of its area.
 * Exit 2 is the only form that the event honors.
 */
export function teammateIdle(input: HookInput): HookResult {
  const home = Home.find(input.cwd ?? process.cwd())
  if (!home) return pass
  const name = String(input.teammate_name ?? '')
  const area = /^(.+)-builder$/.exec(name)?.[1]
  if (!area) return pass
  const eng = Engineering.open(home, whoOf(Caller.lead, input.session_id))
  const s = eng.stores.slices.running().find(s => s.area === area)
  if (!s) return pass
  return block(
    `${name} holds ${s.item} ${s.id} (running). Finish it: \`kit eng task done ${s.item} ${s.id} --files <f...>\`, or \`kit eng task wait ${s.item} ${s.id} --reason "<what you need>"\`, or task fail --reason after three tries.`,
  )
}
