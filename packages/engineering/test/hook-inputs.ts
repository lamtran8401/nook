import type { HookResult } from '@kit/shared/hook.ts'

/** The agents of the hook tests, and the text of a hook result. */

export const BUILDER_AGENT = { agent_type: 'kit-engineering:backend-builder', agent_id: 'agent-ab12' }
export const VERIFIER = { agent_type: 'kit-engineering:verifier', agent_id: 'agent-cd34' }
export const REVIEWER = { agent_type: 'kit-engineering:reviewer', agent_id: 'agent-ef56' }
export const SCOUT = { agent_type: 'scout', agent_id: 'agent-0001' }
export const reason = (r: HookResult) => (r.kind === 'block' ? r.reason : r.kind === 'json' ? JSON.stringify(r.value) : '')
export const rewritten = (r: HookResult) => (r.kind === 'json' ? String((r.value.hookSpecificOutput as { updatedInput: { command: string } }).updatedInput.command) : null)
