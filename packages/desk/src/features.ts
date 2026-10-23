import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { Desk } from './desk.ts'
import { projectRoot } from './project.ts'

export const FEATURE_NAMES = ['core', 'engineering', 'issue-tracker', 'wiki'] as const
export type FeatureName = (typeof FEATURE_NAMES)[number]

/** What Nook does in a desk: the base rules that `nook init` writes for it and what it keeps under the state folder. */
export type Feature = { name: FeatureName; rules: string[]; state: string[] }

export const FEATURES: readonly Feature[] = [
  { name: 'core', rules: ['writing', 'safety', 'questions', 'approach', 'comments'], state: [] },
  { name: 'engineering', rules: ['engineering', 'testing'], state: ['engineering.db'] },
  { name: 'issue-tracker', rules: ['issue-tracker'], state: [] },
  { name: 'wiki', rules: ['wiki'], state: [] },
]

export type ActiveFeature = { name: FeatureName; home: Desk }

/**
 * The features on in `from`. Core is always on, from the outermost desk; any other feature is on from the nearest
 * desk whose nook.yml has its section, so a child desk with its own section becomes the home of the feature.
 */
export function activeFeatures(from = process.cwd()): ActiveFeature[] {
  const desks = Desk.above(from)
  if (!desks.length) return []
  return FEATURES.flatMap(feature => {
    const home = feature.name === 'core' ? desks[0] : desks.findLast(desk => desk.config.has(feature.name))
    return home ? [{ name: feature.name, home }] : []
  })
}

/** The desk that turns the feature on for `from`, or null when no desk above has its section. */
export const featureHome = (name: FeatureName, from = process.cwd()): Desk | null =>
  activeFeatures(from).find(feature => feature.name === name)?.home ?? null

/** Core and each feature whose section is in the nook.yml of the desk itself. */
export const featuresHere = (desk: Desk): Feature[] => FEATURES.filter(feature => feature.name === 'core' || desk.config.has(feature.name))

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
