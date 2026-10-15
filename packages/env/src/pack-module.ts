/** A gap with its fix, or one line of health. */
export type Finding = { level: 'error' | 'warn' | 'ok'; where: string; text: string; fix?: string }

/** The result of an owner move that the owner typed as /gate: whether it moved, and the lines to show. */
export type GateResult = { ok: boolean; lines: string[] }

/** An owner move that waits now: the words to type after /gate, and why it waits. */
export type WaitingGate = { words: string; why: string }

/**
 * What a pack package gives the core, so that the core needs no import of it. Each method takes the folder of the
 * environment that turns the pack on.
 */
export interface PackModule {
  readonly name: string
  /** Makes the folders and the state that the pack needs; returns what it made, relative to the folder. */
  setup(dir: string): string[]
  /** False while kit.yml lacks the section that /setup writes for the pack. */
  configured(dir: string): boolean
  doctor(dir: string): Finding[]
  /** The owner moves of the pack, by their first word, for /gate. */
  readonly gates?: readonly string[]
  /** Runs one owner move; `words` are the words that the owner typed after /gate. */
  gate?(dir: string, words: string[], session: string | null): GateResult
  waiting?(dir: string): WaitingGate[]
}
