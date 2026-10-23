/** The functions that the other packages import. The classes behind them live in their own modules. */
import { Workspace } from './workspace.ts'
import { type Commands, NookConfig } from './nook-config.ts'

export { Workspace, NOOK_FILE, STATE_DIR } from './workspace.ts'
export { BUDGETS, type Budget, type Commands, NookConfig, strings } from './nook-config.ts'
export { type ActiveFeature, activeFeatures, FEATURE_NAMES, FEATURES, type Feature, featureHome, featuresHere, type FeatureName, pluginDir, pluginId } from './features.ts'
export type { BriefItem, BriefLine, FeatureModule, Finding, GateResult, RetroFact, WaitingGate } from './feature-module.ts'
export { projectRoot } from './project.ts'
export { tokensCss, type UiKit, uiKit } from './ui-kit.ts'

export const parseNookConfig = (source: string, file: string): NookConfig => NookConfig.parse(source, file)
export const readWorkspace = (dir: string): Workspace => Workspace.read(dir)
export const workspacesAbove = (from = process.cwd()): Workspace[] => Workspace.above(from)
export const nearestWorkspace = (from = process.cwd()): Workspace | null => Workspace.nearest(from)

export const secretsAbove = (from = process.cwd()): string[] => Workspace.above(from).flatMap(workspace => workspace.secretFiles())

/** The command lists of each workspace above, the outermost first, with no doubles: a child adds to its parents and drops nothing. */
export function commandsAbove(from = process.cwd()): Commands {
  const all = Workspace.above(from).map(workspace => workspace.config.commands)
  const join = (key: keyof Commands) => [...new Set(all.flatMap(commands => commands[key]))]
  return { allow: join('allow'), ask: join('ask'), deny: join('deny') }
}
