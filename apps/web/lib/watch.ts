import { type FSWatcher, existsSync, watch } from 'node:fs'
import { join } from 'node:path'

import { deskPlaces } from '@/lib/places.ts'

/**
 * Watches what a page shows: the folders of the packs, and `.nook/`, where each write of the ledger lands. A burst of
 * writes, such as a move that writes the ledger and a file, gives one change after `quietMs`. The code of an area is
 * not watched. Returns the stop.
 */
export function watchDesk(desk: string, onChange: () => void, quietMs = 250): () => void {
  const roots = [...deskPlaces(desk).map(place => place.root), join(desk, '.nook')].filter(root => existsSync(root))
  let timer: ReturnType<typeof setTimeout> | null = null
  const changed = () => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      onChange()
    }, quietMs)
  }
  const watchers: FSWatcher[] = roots.map(root => watch(root, { recursive: true }, changed))
  return () => {
    if (timer) clearTimeout(timer)
    for (const watcher of watchers) watcher.close()
  }
}
