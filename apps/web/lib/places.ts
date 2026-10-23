import { existsSync } from 'node:fs'

import { Home } from '@nook/engineering/home.ts'
import { findWiki } from '@nook/wiki/module.ts'

/** A folder that a feature owns, and the page of the web app for one of its files. */
export type Place = { root: string; href: (rel: string) => string }

const DOC_TABS = ['spec', 'plan', 'tasks', 'walkthrough']

/** `SHOP-42/plan.md` opens the tab Plan of the item; another file of the item opens its Overview. */
function itemHref(base: string, rel: string): string {
  const [id, file = ''] = rel.split('/')
  const tab = file.replace(/\.md$/, '')
  return DOC_TABS.includes(tab) ? `${base}/works/${id}?tab=${tab}` : `${base}/works/${id}`
}

/** The folders of the features of the workspace that exist: the item folders and the wiki; each address starts with `base`. */
export function workspacePlaces(workspace: string, base = ''): Place[] {
  const works = Home.find(workspace)?.workRoot
  const wiki = findWiki(workspace)?.dir
  return [
    ...(works ? [{ root: works, href: (rel: string) => itemHref(base, rel) }] : []),
    ...(wiki ? [{ root: wiki, href: (rel: string) => `${base}/wiki/${rel}` }] : []),
  ].filter(place => existsSync(place.root))
}
