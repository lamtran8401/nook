import { basename } from 'node:path'

import { DeskList } from '@nook/desk/desk-list.ts'

/** One desk that the web app shows: its path segment, its folder and its name. */
export type DeskRef = { slug: string; dir: string; name: string }

const slugOf = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'desk'

/** The folder where `nook web` started, from `NOOK_DESK`. */
export function startDir(): string {
  const dir = process.env.NOOK_DESK
  if (!dir) throw new Error('NOOK_DESK is not set: start the web app with `nook web`')
  return dir
}

/**
 * The desks of the web app: the one where `nook web` started first, then each desk of the owner's list once. Two
 * desks with one folder name get a number, such as `personal-2`.
 */
export function listDesks(start = startDir(), list = DeskList.mine().dirs()): DeskRef[] {
  const seen = new Map<string, number>()
  return [start, ...list.filter(dir => dir !== start)].map(dir => {
    const name = basename(dir)
    const slug = slugOf(name)
    const n = (seen.get(slug) ?? 0) + 1
    seen.set(slug, n)
    return { slug: n === 1 ? slug : `${slug}-${n}`, dir, name }
  })
}

export const deskBySlug = (slug: string, desks = listDesks()): DeskRef | null => desks.find(desk => desk.slug === slug) ?? null
