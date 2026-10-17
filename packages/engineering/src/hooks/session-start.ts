import { context, type HookInput, type HookResult, pass } from '@nook/shared/hook.ts'

import { nextText } from '../format.ts'
import { Home } from '../home.ts'
import { next } from '../report/next.ts'
import { Engineering } from '../service.ts'
import { Caller, whoOf } from './caller.ts'

const LINES = 8

/** SessionStart: the first lines of `nook eng next` as context. */
export function sessionStart(input: HookInput): HookResult {
  const home = Home.find(input.cwd ?? process.cwd())
  if (!home) return pass
  const eng = Engineering.open(home, whoOf(Caller.lead, input.session_id))
  const lines = nextText(next(eng)).split('\n').slice(0, LINES)
  return context(
    'SessionStart',
    `Engineering (${home.dir}):\n${lines.join('\n')}\nRun \`nook eng next\` for the full list, \`nook eng pickup <id>\` to take an item.`,
  )
}
