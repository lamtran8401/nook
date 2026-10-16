/** The functions that the other packages import. The classes behind them live in their own modules. */
import { Environment } from './environment.ts'
import { KitConfig } from './kit-config.ts'

export { Environment, KIT_FILE, STATE_DIR } from './environment.ts'
export { KitConfig, strings } from './kit-config.ts'
export { type ActivePack, activePacks } from './packs.ts'
export type { BriefLine, Finding, GateResult, PackModule, WaitingGate } from './pack-module.ts'
export { projectRoot } from './project.ts'
export { tokensCss, type UiKit, uiKit } from './ui-kit.ts'

export const parseKitConfig = (source: string, file: string): KitConfig => KitConfig.parse(source, file)
export const readEnvironment = (dir: string): Environment => Environment.read(dir)
export const environmentsAbove = (from = process.cwd()): Environment[] => Environment.above(from)
export const nearestEnvironment = (from = process.cwd()): Environment | null => Environment.nearest(from)

export const secretsAbove = (from = process.cwd()): string[] => Environment.above(from).flatMap(env => env.secretFiles())
