import { existsSync, mkdirSync } from 'node:fs'
import { join, relative } from 'node:path'

import { activePacks, type PackModule } from '@kit/env/env.ts'
import { EvError, Exit } from '@kit/shared/errors.ts'

import { WikiConfig } from './config.ts'
import { Wiki } from './wiki.ts'

/** The wiki of the nearest environment above `cwd` that turns the pack on. */
export function findWiki(cwd = process.cwd()): Wiki | null {
  const pack = activePacks(cwd).find(p => p.name === 'wiki')
  return pack ? new Wiki(pack.home.dir, WikiConfig.from(pack.home.config.section('wiki'))) : null
}

export function requireWiki(cwd = process.cwd()): Wiki {
  const wiki = findWiki(cwd)
  if (wiki) return wiki
  throw new EvError('not inside an environment that turns the wiki pack on', Exit.error, 'add `wiki` to `packs:` in kit.yml, then run /setup')
}

/** The wiki of `dir` only when `dir` itself turns the pack on: a child does not set up its parent. */
const wikiAt = (dir: string): Wiki | null => {
  const wiki = findWiki(dir)
  return wiki && wiki.home === dir ? wiki : null
}

export const wikiModule: PackModule = {
  name: 'wiki',

  setup(dir) {
    const wiki = wikiAt(dir)
    if (!wiki) return []
    const folders = [wiki.dir, join(dir, wiki.config.references), ...wiki.config.shelves.map(s => join(wiki.dir, s.name))]
    const made = folders.filter(folder => !existsSync(folder))
    for (const folder of made) mkdirSync(folder, { recursive: true })
    return made.map(folder => `${relative(dir, folder)}/`)
  },

  configured(dir) {
    return !wikiAt(dir)?.config.missing
  },

  doctor(dir) {
    const wiki = wikiAt(dir)
    return wiki && !wiki.config.missing ? wiki.check() : []
  },
}
