import { type FSWatcher, existsSync, watch } from 'node:fs'
import { join } from 'node:path'

import { workspacePlaces } from '@/lib/places.ts'

/**
 * Watches what a page shows: the folders of the features, and `.nook/`, where each write of the ledger lands. A burst of
 * writes, such as a move that writes the ledger and a file, gives one change after `quietMs`. The code of an area is
 * not watched. Returns the stop.
 */
export function watchWorkspace(workspace: string, onChange: () => void, quietMs = 250): () => void {
  const roots = [...workspacePlaces(workspace).map(place => place.root), join(workspace, '.nook')].filter(root => existsSync(root))
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
