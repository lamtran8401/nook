import { homedir } from 'node:os'

import { headers } from 'next/headers'
import type { ReactNode } from 'react'

import { AppShell } from '@nook/ui/components/app-shell.tsx'
import { Toaster } from '@nook/ui/components/toast.tsx'

import { AreaTones } from '@/components/areas.tsx'
import { WorkspaceCommands } from '@/components/workspace-commands.tsx'
import { WorkspaceNav, PageCrumbs } from '@/components/workspace-nav.tsx'
import { Live } from '@/components/live.tsx'
import { Owner, ViewerNote } from '@/components/owner.tsx'
import type { CommandData } from '@/lib/commands.ts'
import { board, workspaceAreas, workspacePages, openCount, openWorkspace } from '@/lib/workspace.ts'
import { listWorkspaces } from '@/lib/workspaces.ts'
import { OWNER_HEADER } from '@/lib/gate.ts'
import { ownerGate } from '@/lib/turn.ts'

export const dynamic = 'force-dynamic'

const WORKSPACE_TONES = ['primary', 'violet', 'aqua', 'warning', 'success', 'danger']

type Props = { children: ReactNode; params: Promise<{ workspace: string }> }

export async function generateMetadata({ params }: Pick<Props, 'params'>) {
  return { title: `Nook · ${(await openWorkspace(params)).name}` }
}

/** The folder of a workspace as the owner reads it, with the home folder as ~. */
const placeOf = (dir: string) => (dir.startsWith(homedir()) ? `~${dir.slice(homedir().length)}` : dir)

/**
 * The shell of a workspace: the sidebar with the workspace menu and the pages, the top bar, the page, and the ⌘K menu. The gate
 * says if the browser is paired.
 */
export default async function WorkspaceLayout({ children, params }: Props) {
  const workspace = await openWorkspace(params)
  const paired = (await headers()).get(OWNER_HEADER) === '1'
  const workspaces = listWorkspaces().map((d, i) => ({ name: d.name, href: `/${d.slug}`, tone: WORKSPACE_TONES[i % WORKSPACE_TONES.length]!, place: placeOf(d.dir), open: openCount(d.dir), active: d.slug === workspace.slug }))
  const works = workspacePages(workspace.dir).some(page => page.key === 'works')
  const open = works ? openCount(workspace.dir) : undefined
  const pages = workspacePages(workspace.dir).map(page => ({ key: page.key, label: page.label, href: `${workspace.base}${page.path}`, ...(page.footer ? { footer: true } : {}), ...(page.key === 'works' && open !== undefined ? { count: open } : {}) }))
  const cards = works ? board(workspace.dir) : []
  const commands: CommandData = {
    base: workspace.base,
    moves: cards.flatMap(card => {
      const move = ownerGate(card.next)
      return move ? [{ move, item: card.id, title: card.title }] : []
    }),
    items: cards.map(card => ({ id: card.id, title: card.title, state: card.state })),
    pages: pages.map(page => ({ label: page.label, href: page.href })),
    workspaces: workspaces.filter(d => !d.active).map(d => ({ name: d.name, href: d.href, ...(d.open === undefined ? {} : { open: d.open }) })),
  }
  return (
    <Owner paired={paired}>
      <AppShell sidebar={<WorkspaceNav workspaces={workspaces} base={workspace.base} pages={pages} />} top={<PageCrumbs workspace={workspace.name} base={workspace.base} pages={pages} />}>
        <ViewerNote />
        <AreaTones names={workspaceAreas(workspace.dir)}>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-5">{children}</div>
        </AreaTones>
      </AppShell>
      <WorkspaceCommands data={commands} />
      <Toaster />
      <Live base={workspace.base} />
    </Owner>
  )
}
