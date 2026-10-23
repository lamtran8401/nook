import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { Workspace } from './workspace.ts'
import { projectRoot } from './project.ts'

export const FEATURE_NAMES = ['core', 'engineering', 'issue-tracker', 'wiki'] as const
export type FeatureName = (typeof FEATURE_NAMES)[number]

/** What Nook does in a workspace: the base rules that `nook init` writes for it and what it keeps under the state folder. */
export type Feature = { name: FeatureName; rules: string[]; state: string[] }

export const FEATURES: readonly Feature[] = [
  { name: 'core', rules: ['writing', 'safety', 'questions', 'approach', 'comments'], state: [] },
  { name: 'engineering', rules: ['engineering', 'testing'], state: ['engineering.db'] },
  { name: 'issue-tracker', rules: ['issue-tracker'], state: [] },
  { name: 'wiki', rules: ['wiki'], state: [] },
]

export type ActiveFeature = { name: FeatureName; home: Workspace }

/**
 * The features on in `from`. Core is always on, from the outermost workspace; any other feature is on from the nearest
 * workspace whose nook.yml has its section, so a child workspace with its own section becomes the home of the feature.
 */
export function activeFeatures(from = process.cwd()): ActiveFeature[] {
  const workspaces = Workspace.above(from)
  if (!workspaces.length) return []
  return FEATURES.flatMap(feature => {
    const home = feature.name === 'core' ? workspaces[0] : workspaces.findLast(workspace => workspace.config.has(feature.name))
    return home ? [{ name: feature.name, home }] : []
  })
}

/** The workspace that turns the feature on for `from`, or null when no workspace above has its section. */
export const featureHome = (name: FeatureName, from = process.cwd()): Workspace | null =>
  activeFeatures(from).find(feature => feature.name === name)?.home ?? null

/** Core and each feature whose section is in the nook.yml of the workspace itself. */
export const featuresHere = (workspace: Workspace): Feature[] => FEATURES.filter(feature => feature.name === 'core' || workspace.config.has(feature.name))

/** The one Claude Code plugin of the nook project: skills, agents, hooks and templates. */
export const pluginDir = (root = projectRoot()): string => join(root, 'plugin')

/** The id that Claude Code knows the plugin by: `<plugin name>@<marketplace name>`. */
export function pluginId(root = projectRoot()): string | undefined {
  const plugin = readJson(join(pluginDir(root), '.claude-plugin', 'plugin.json'))
  const marketplace = readJson(join(root, '.claude-plugin', 'marketplace.json'))
  return plugin?.name && marketplace?.name ? `${plugin.name}@${marketplace.name}` : undefined
}

const readJson = (file: string): { name?: string } | undefined =>
  existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as { name?: string }) : undefined
