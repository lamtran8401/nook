import { maskSecrets, recordEvent } from '@nook/desk/events.ts'
import { type HookInput, type HookResult, pass } from '@nook/shared/hook.ts'

/** UserPromptSubmit: keeps the prompt of the owner in the event log of the desk, each token masked, for a retro. */
export function promptHook(input: HookInput): HookResult {
  const text = typeof input.prompt === 'string' ? input.prompt : ''
  if (text.trim()) recordEvent(input.cwd ?? process.cwd(), { kind: 'prompt', ...(input.session_id ? { session: input.session_id } : {}), text: maskSecrets(text) })
  return pass
}
