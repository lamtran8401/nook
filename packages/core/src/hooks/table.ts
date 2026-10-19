import type { HookInput, HookResult } from '@nook/shared/hook.ts'

import { bashGuard, editGuard, readGuard } from './guards.ts'
import { promptHook } from './prompt.ts'
import { sessionStart } from './start.ts'

/** A hook of the core: its handler, and whether it blocks when it fails (a guard) or lets the call pass (a helper). */
export type CoreHook = { handler: (input: HookInput) => HookResult; closed: boolean }

export const CORE_HOOKS: Record<string, CoreHook> = {
  read: { handler: readGuard, closed: true },
  bash: { handler: bashGuard, closed: true },
  edit: { handler: editGuard, closed: true },
  start: { handler: sessionStart, closed: false },
  prompt: { handler: promptHook, closed: false },
}
