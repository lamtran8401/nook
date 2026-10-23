import type { Command } from '@nook/ui/lib/commands.ts'

import { STATE_TONE } from '@/components/tones.ts'

/** What the menu of a workspace lists, as the server reads it: the moves that wait for the owner, the items, the pages, the workspaces. */
export type CommandData = {
  base: string
  moves: { move: string; item: string; title: string }[]
  items: { id: string; title: string; state: string }[]
  pages: { label: string; href: string }[]
  workspaces: { name: string; href: string; open?: number }[]
}

/** How a command acts: `go` opens an address, `move` runs an owner move through the form of the page, which asks first. */
export type CommandActs = { go: (href: string) => void; move: (move: string, item: string) => void }

const capital = (word: string) => word.charAt(0).toUpperCase() + word.slice(1)

/** The keys of each page: G and its first letter; a letter that an earlier page took gives no keys. */
function pageKeys(pages: CommandData['pages']): (string[] | undefined)[] {
  const taken = new Set<string>()
  return pages.map(page => {
    const letter = page.label.charAt(0).toLowerCase()
    if (taken.has(letter)) return undefined
    taken.add(letter)
    return ['g', letter]
  })
}

/** The commands of a workspace in the order of the menu. A browser with no pair gets no move: the gate refuses it. */
export function workspaceCommands(data: CommandData, paired: boolean, acts: CommandActs): Command[] {
  const keys = pageKeys(data.pages)
  return [
    ...(paired ? data.moves : []).map(m => ({ id: `move-${m.move}-${m.item}`, group: 'Your moves', label: `${capital(m.move)} ${m.item}`, sub: m.title, tone: 'danger', run: () => acts.move(m.move, m.item) })),
    ...data.items.map(i => ({ id: `item-${i.id}`, group: 'Items', label: `${i.id} ${i.title}`, sub: i.state, tone: STATE_TONE[i.state] ?? 'neutral', run: () => acts.go(`${data.base}/works/${i.id}`) })),
    ...data.pages.map((p, n) => ({ id: `page-${p.href}`, group: 'Go to', label: p.label, sub: 'page', ...(keys[n] ? { keys: keys[n] } : {}), run: () => acts.go(p.href) })),
    ...data.workspaces.map(d => ({ id: `workspace-${d.href}`, group: 'Workspaces', label: d.name, sub: d.open === undefined ? 'workspace' : `${d.open} open items`, run: () => acts.go(d.href) })),
  ]
}

/** The command that the typed words add: a search of the workspace for them. */
export const searchCommand = (base: string, words: string, go: (href: string) => void): Command => ({
  id: 'search',
  group: 'Search',
  label: `Search the workspace for “${words}”`,
  run: () => go(`${base}/search?q=${encodeURIComponent(words)}`),
})
