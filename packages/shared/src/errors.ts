/** The exit codes of every kit command. A skill, a hook or a script branches on them. */
export const Exit = {
  ok: 0,
  error: 1,
  usage: 2,
  /** A guard or a state rule refused the move. The message lists the gaps and the fix. */
  refused: 3,
  /** The record changed after the caller read it (`--if-version`). Read it again. */
  conflict: 4,
  /** The role of the caller may not do this. */
  denied: 5,
} as const

export type ExitCode = (typeof Exit)[keyof typeof Exit]

export class EvError extends Error {
  constructor(
    message: string,
    readonly code: ExitCode = Exit.error,
    readonly fix?: string,
  ) {
    super(message)
  }
}

export const usage = (message: string, fix?: string) => new EvError(message, Exit.usage, fix)
export const refused = (message: string, fix?: string) => new EvError(message, Exit.refused, fix)
export const denied = (message: string, fix?: string) => new EvError(message, Exit.denied, fix)
export const conflict = (message: string, fix?: string) => new EvError(message, Exit.conflict, fix)
