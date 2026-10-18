/**
 * Helpers for a Claude Code hook command.
 * Exit 0 with no output is "no opinion". Exit 2 blocks, and stderr goes to Claude. Any other exit does not block.
 * A guard must fail closed: when it cannot decide, it blocks with the reason.
 */

export type HookInput = {
  session_id?: string
  cwd?: string
  hook_event_name?: string
  tool_name?: string
  tool_input?: Record<string, unknown>
  agent_id?: string
  agent_type?: string
  prompt?: string
  stop_hook_active?: boolean
  /** UserPromptExpansion: the command that a person typed, and the words after it. */
  command_name?: string
  command_args?: string
  [key: string]: unknown
}

export async function readInput(): Promise<HookInput> {
  const chunks: Buffer[] = []
  for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk))
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw.trim()) return {}
  return JSON.parse(raw) as HookInput
}

export type HookResult =
  | { kind: 'pass' }
  | { kind: 'block'; reason: string }
  | { kind: 'json'; value: Record<string, unknown> }

export const pass: HookResult = { kind: 'pass' }
export const block = (reason: string): HookResult => ({ kind: 'block', reason })

/** PreToolUse: run the tool with changed input (for example a Bash command with the role of the agent). */
export const rewrite = (updatedInput: Record<string, unknown>): HookResult => ({
  kind: 'json',
  value: { hookSpecificOutput: { hookEventName: 'PreToolUse', updatedInput } },
})

/** Facts for Claude next to the event (SessionStart, UserPromptSubmit). Write facts, not orders. */
export const context = (event: string, additionalContext: string): HookResult => ({
  kind: 'json',
  value: { hookSpecificOutput: { hookEventName: event, additionalContext } },
})

/** Stop or SubagentStop: keep the agent working, with the reason as its next instruction. */
export const hold = (reason: string): HookResult => ({ kind: 'json', value: { decision: 'block', reason } })

/** Writes the result and returns the exit code. A thrown error in a guard blocks (fail closed) when `closed` is true. */
export async function runHook(handler: () => Promise<HookResult> | HookResult, closed: boolean): Promise<number> {
  let result: HookResult
  try {
    result = await handler()
  } catch (error) {
    if (!closed) return 0
    result = block(`the guard failed, so the call is blocked: ${(error as Error).message}`)
  }
  if (result.kind === 'block') {
    process.stderr.write(`${result.reason}\n`)
    return 2
  }
  if (result.kind === 'json') process.stdout.write(`${JSON.stringify(result.value)}\n`)
  return 0
}
