import type { HookInput, HookResult } from '@kit/shared/hook.ts'

import { bashGuard } from './bash-guard.ts'
import { editGuard } from './edit-guard.ts'
import { sessionStart } from './session-start.ts'
import { stopDriver } from './stop-driver.ts'
import { subagentStop } from './subagent-stop.ts'
import { teammateIdle } from './teammate-idle.ts'

/** The hooks of `kit eng hook <name>`. A guard blocks when it fails (`closed`); a helper lets it pass. */

export const HOOK_NAMES = ['bash', 'edit', 'stop', 'subagent-stop', 'teammate-idle', 'start'] as const
export type HookName = (typeof HOOK_NAMES)[number]

export type Hook = { run: (input: HookInput) => HookResult; closed: boolean }

export const HOOKS: Record<HookName, Hook> = {
  bash: { run: bashGuard, closed: true },
  edit: { run: editGuard, closed: true },
  stop: { run: stopDriver, closed: false },
  'subagent-stop': { run: subagentStop, closed: false },
  'teammate-idle': { run: teammateIdle, closed: false },
  start: { run: sessionStart, closed: false },
}

export const hookNamed = (name: string): Hook | undefined => {
  const found = HOOK_NAMES.find(h => h === name)
  return found ? HOOKS[found] : undefined
}
