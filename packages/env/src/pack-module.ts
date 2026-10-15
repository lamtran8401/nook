/** A gap with its fix, or one line of health. */
export type Finding = { level: 'error' | 'warn' | 'ok'; where: string; text: string; fix?: string }

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
}
