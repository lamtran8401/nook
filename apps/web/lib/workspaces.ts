import { basename } from 'node:path'

import { WorkspaceList } from '@nook/workspace/workspace-list.ts'

/** One workspace that the web app shows: its path segment, its folder and its name. */
export type WorkspaceRef = { slug: string; dir: string; name: string }

const slugOf = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'workspace'

/** The folder where `nook web` started, from `NOOK_WORKSPACE`. */
export function startDir(): string {
  const dir = process.env.NOOK_WORKSPACE
  if (!dir) throw new Error('NOOK_WORKSPACE is not set: start the web app with `nook web`')
  return dir
}

/**
 * The workspaces of the web app: the one where `nook web` started first, then each workspace of the owner's list once. Two
 * workspaces with one folder name get a number, such as `personal-2`.
 */
export function listWorkspaces(start = startDir(), list = WorkspaceList.mine().dirs()): WorkspaceRef[] {
  const seen = new Map<string, number>()
  return [start, ...list.filter(dir => dir !== start)].map(dir => {
    const name = basename(dir)
    const slug = slugOf(name)
    const n = (seen.get(slug) ?? 0) + 1
    seen.set(slug, n)
    return { slug: n === 1 ? slug : `${slug}-${n}`, dir, name }
  })
}

export const workspaceBySlug = (slug: string, workspaces = listWorkspaces()): WorkspaceRef | null => workspaces.find(workspace => workspace.slug === slug) ?? null
