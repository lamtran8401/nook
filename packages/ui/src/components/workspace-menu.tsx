'use client'

import { Check, ChevronDown } from 'lucide-react'

import { Menu, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuTrigger } from '@nook/ui/components/menu.tsx'

export type MenuWorkspace = { name: string; href: string; tone: string; place: string; open?: number; active: boolean }

const Tile = ({ workspace, small = false }: { workspace: MenuWorkspace; small?: boolean }) => (
  <span data-tone={workspace.tone} className={small ? 'grid size-[22px] shrink-0 place-items-center rounded-[7px] bg-tone text-[9.5px] font-bold text-surface' : 'grid size-[26px] shrink-0 place-items-center rounded-[8px] bg-tone text-[10.5px] font-bold text-surface'}>
    {workspace.name.slice(0, 2).toUpperCase()}
  </span>
)

/** The workspace at the top of the sidebar, with a menu of every workspace of the owner: its open count, the open one checked. */
export function WorkspaceMenu({ workspaces }: { workspaces: MenuWorkspace[] }) {
  const current = workspaces.find(workspace => workspace.active) ?? workspaces[0]
  if (!current) return null
  return (
    <Menu>
      <MenuTrigger className="flex min-w-0 flex-1 items-center gap-2.5 rounded-[12px] py-1 pr-2 pl-1 text-left outline-none hover:bg-surface hover:shadow-xs data-[state=open]:bg-surface data-[state=open]:shadow-xs">
        <Tile workspace={current} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{current.name}</span>
          <span className="block truncate text-[11.5px] text-muted-foreground">{current.place}</span>
        </span>
        <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden="true" />
      </MenuTrigger>
      <MenuContent align="start" className="w-[264px]">
        <MenuLabel>Workspaces</MenuLabel>
        {workspaces.map(workspace => (
          <MenuItem key={workspace.href} asChild>
            <a href={workspace.href} {...(workspace.active ? { 'aria-current': 'page' as const } : {})}>
              <Tile workspace={workspace} small />
              <span className="min-w-0 flex-1 truncate">
                {workspace.name}
                {workspace.open === undefined ? null : <span className="ml-1 text-xs text-muted-foreground">· {workspace.open} open</span>}
              </span>
              {workspace.active ? <Check className="size-3.5 text-primary" aria-hidden="true" /> : null}
            </a>
          </MenuItem>
        ))}
        <MenuSeparator />
        <p className="px-2 pt-1 pb-1.5 text-xs text-muted-foreground">
          Add a workspace: run <span className="font-mono">nook init</span> in its folder.
        </p>
      </MenuContent>
    </Menu>
  )
}
