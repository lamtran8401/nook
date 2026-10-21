'use client'

import { Check, LayoutGrid, List, SlidersHorizontal } from 'lucide-react'

import { Button } from '@nook/ui/components/button.tsx'
import { Menu, MenuContent, MenuItem, MenuLabel, MenuTrigger } from '@nook/ui/components/menu.tsx'
import { cn } from '@nook/ui/lib/utils.ts'

import { type BoardOptions, boardHref, HOLDERS } from '@/lib/board.ts'

const LAYOUTS = [
  { key: 'board', name: 'Board', icon: LayoutGrid },
  { key: 'list', name: 'List', icon: List },
] as const
const GROUPS = [
  { key: 'phase', name: 'Phase', about: 'shape, build, review, done' },
  { key: 'holder', name: 'Who holds it', about: HOLDERS.slice(0, 4).map(h => h.title.toLowerCase()).join(', ') },
] as const

/** The Display menu of the board: a layout and a grouping, each a link, so a view of the board has its own address. */
export function DisplayMenu({ base, options }: { base: string; options: BoardOptions }) {
  const layout = LAYOUTS.find(l => l.key === options.layout)!
  const group = GROUPS.find(g => g.key === options.group)!
  return (
    <Menu>
      <MenuTrigger asChild>
        <Button variant="outline">
          <SlidersHorizontal className="size-3.5" aria-hidden="true" />
          <span className="text-muted-foreground">Display</span>
          {layout.name} · {group.name}
        </Button>
      </MenuTrigger>
      <MenuContent align="end" className="w-[280px]">
        <MenuLabel>Layout</MenuLabel>
        <div className="grid grid-cols-2 gap-1.5 px-1 pb-1.5">
          {LAYOUTS.map(l => (
            <MenuItem key={l.key} asChild>
              <a
                href={boardHref(base, options, { layout: l.key })}
                {...(l.key === options.layout ? { 'aria-current': 'true' as const } : {})}
                className={cn('flex-col justify-center gap-1.5 py-2.5 text-[12.5px] text-muted-foreground', l.key === options.layout && 'bg-surface font-medium text-foreground shadow-xs')}
              >
                <l.icon className="size-[18px]" aria-hidden="true" />
                {l.name}
              </a>
            </MenuItem>
          ))}
        </div>
        <MenuLabel>Group by</MenuLabel>
        {GROUPS.map(g => (
          <MenuItem key={g.key} asChild>
            <a href={boardHref(base, options, { group: g.key })} {...(g.key === options.group ? { 'aria-current': 'true' as const } : {})}>
              <span className="min-w-0 flex-1">
                {g.name}
                <small className="block text-[11.5px] text-muted-foreground">{g.about}</small>
              </span>
              {g.key === options.group ? <Check className="size-3.5 text-primary" aria-hidden="true" /> : null}
            </a>
          </MenuItem>
        ))}
      </MenuContent>
    </Menu>
  )
}
