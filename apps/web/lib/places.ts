import { existsSync } from 'node:fs'

import { Home } from '@nook/engineering/home.ts'
import { findLearn } from '@nook/learn/learn.ts'
import { findWiki } from '@nook/wiki/module.ts'

/** A folder that a pack owns, and the page of the web app for one of its files. */
export type Place = { root: string; href: (rel: string) => string }

const DOC_TABS = ['spec', 'plan', 'tasks', 'walkthrough']

/** `SHOP-42/plan.md` opens the tab Plan of the item; another file of the item opens its Overview. */
function itemHref(rel: string): string {
  const [id, file = ''] = rel.split('/')
  const tab = file.replace(/\.md$/, '')
  return DOC_TABS.includes(tab) ? `/works/${id}?tab=${tab}` : `/works/${id}`
}

/** The folders of the packs of the desk that exist: the item folders, the wiki and the courses. */
export function deskPlaces(desk: string): Place[] {
  const works = Home.find(desk)?.workRoot
  const wiki = findWiki(desk)?.dir
  const learn = findLearn(desk)?.dir
  return [
    ...(works ? [{ root: works, href: itemHref }] : []),
    ...(wiki ? [{ root: wiki, href: (rel: string) => `/wiki/${rel}` }] : []),
    ...(learn ? [{ root: learn, href: (rel: string) => `/learn/${rel.split('/')[0]}` }] : []),
  ].filter(place => existsSync(place.root))
}
