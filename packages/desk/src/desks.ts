/** The functions that the other packages import. The classes behind them live in their own modules. */
import { Desk } from './desk.ts'
import { NookConfig } from './nook-config.ts'

export { Desk, NOOK_FILE, STATE_DIR } from './desk.ts'
export { NookConfig, strings } from './nook-config.ts'
export { type ActivePack, activePacks } from './packs.ts'
export type { BriefLine, Finding, GateResult, PackModule, RetroFact, WaitingGate } from './pack-module.ts'
export { projectRoot } from './project.ts'
export { tokensCss, type UiKit, uiKit } from './ui-kit.ts'

export const parseNookConfig = (source: string, file: string): NookConfig => NookConfig.parse(source, file)
export const readDesk = (dir: string): Desk => Desk.read(dir)
export const desksAbove = (from = process.cwd()): Desk[] => Desk.above(from)
export const nearestDesk = (from = process.cwd()): Desk | null => Desk.nearest(from)

export const secretsAbove = (from = process.cwd()): string[] => Desk.above(from).flatMap(desk => desk.secretFiles())
