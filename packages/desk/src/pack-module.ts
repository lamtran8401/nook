/** A gap with its fix, or one line of health. */
export type Finding = { level: 'error' | 'warn' | 'ok'; where: string; text: string; fix?: string }

/** The result of an owner move that the owner typed as /gate: whether it moved, and the lines to show. */
export type GateResult = { ok: boolean; lines: string[] }

/** One line of the daily brief: its part, what it says, the action for it, and for a wait whether it comes first. */
export type BriefLine = { part: 'waits' | 'done' | 'runs'; text: string; action?: string; urgent?: boolean }

/** One fact of a retro: what went wrong or cost time, the item, and when its event happened. */
export type RetroFact = { item: string; kind: string; text: string; at: string }

/** An owner move that waits now: the words to type after /gate, and why it waits. */
export type WaitingGate = { words: string; why: string }

/**
 * What a pack package gives the core, so that the core needs no import of it. Each method takes the folder of the
 * desk that turns the pack on.
 */
export interface PackModule {
  readonly name: string
  /** Makes the folders and the state that the pack needs; returns what it made, relative to the folder. */
  setup(dir: string): string[]
  /** False while nook.yml lacks the section that /setup writes for the pack. */
  configured(dir: string): boolean
  doctor(dir: string): Finding[]
  /** The folders of the record of the pack, as absolute paths, that the writing check reads. */
  records?(dir: string): string[]
  /** The lines of the pack for the daily brief: what waits for the owner, what is done since `since`, what runs. `now` is the time of the brief. */
  brief?(dir: string, since: Date, now?: Date): BriefLine[]
  /** The facts of the pack for a retro: what went wrong or cost time since `since`, each from its event. */
  retro?(dir: string, since: Date): RetroFact[]
  /** The owner moves of the pack, by their first word, for /gate. */
  readonly gates?: readonly string[]
  /** Runs one owner move; `words` are the words that the owner typed after /gate. */
  gate?(dir: string, words: string[], session: string | null): GateResult
  waiting?(dir: string): WaitingGate[]
  /** The commands of the pack that run as the owner when the owner types them, as `yolo` for /yolo. */
  readonly commands?: readonly string[]
  /** Runs one typed command; `args` is the text that the owner typed after it. */
  command?(dir: string, name: string, args: string, session: string | null): GateResult
}
