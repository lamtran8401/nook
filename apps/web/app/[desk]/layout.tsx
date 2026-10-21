import { homedir } from 'node:os'

import { headers } from 'next/headers'
import type { ReactNode } from 'react'

import { AppShell } from '@nook/ui/components/app-shell.tsx'
import { Toaster } from '@nook/ui/components/toast.tsx'

import { AreaTones } from '@/components/areas.tsx'
import { DeskCommands } from '@/components/desk-commands.tsx'
import { DeskNav, PageCrumbs } from '@/components/desk-nav.tsx'
import { Live } from '@/components/live.tsx'
import { Owner, ViewerNote } from '@/components/owner.tsx'
import type { CommandData } from '@/lib/commands.ts'
import { board, deskAreas, deskPages, openCount, openDesk } from '@/lib/desk.ts'
import { listDesks } from '@/lib/desks.ts'
import { OWNER_HEADER } from '@/lib/gate.ts'
import { ownerGate } from '@/lib/turn.ts'

export const dynamic = 'force-dynamic'

const DESK_TONES = ['primary', 'violet', 'aqua', 'warning', 'success', 'danger']

type Props = { children: ReactNode; params: Promise<{ desk: string }> }

export async function generateMetadata({ params }: Pick<Props, 'params'>) {
  return { title: `Nook · ${(await openDesk(params)).name}` }
}

/** The folder of a desk as the owner reads it, with the home folder as ~. */
const placeOf = (dir: string) => (dir.startsWith(homedir()) ? `~${dir.slice(homedir().length)}` : dir)

/**
 * The shell of a desk: the sidebar with the desk menu and the pages, the top bar, the page, and the ⌘K menu. The gate
 * says if the browser is paired.
 */
export default async function DeskLayout({ children, params }: Props) {
  const desk = await openDesk(params)
  const paired = (await headers()).get(OWNER_HEADER) === '1'
  const desks = listDesks().map((d, i) => ({ name: d.name, href: `/${d.slug}`, tone: DESK_TONES[i % DESK_TONES.length]!, place: placeOf(d.dir), open: openCount(d.dir), active: d.slug === desk.slug }))
  const works = deskPages(desk.dir).some(page => page.key === 'works')
  const open = works ? openCount(desk.dir) : undefined
  const pages = deskPages(desk.dir).map(page => ({ key: page.key, label: page.label, href: `${desk.base}${page.path}`, ...(page.footer ? { footer: true } : {}), ...(page.key === 'works' && open !== undefined ? { count: open } : {}) }))
  const cards = works ? board(desk.dir) : []
  const commands: CommandData = {
    base: desk.base,
    moves: cards.flatMap(card => {
      const move = ownerGate(card.next)
      return move ? [{ move, item: card.id, title: card.title }] : []
    }),
    items: cards.map(card => ({ id: card.id, title: card.title, state: card.state })),
    pages: pages.map(page => ({ label: page.label, href: page.href })),
    desks: desks.filter(d => !d.active).map(d => ({ name: d.name, href: d.href, ...(d.open === undefined ? {} : { open: d.open }) })),
  }
  return (
    <Owner paired={paired}>
      <AppShell sidebar={<DeskNav desks={desks} base={desk.base} pages={pages} />} top={<PageCrumbs desk={desk.name} base={desk.base} pages={pages} />}>
        <ViewerNote />
        <AreaTones names={deskAreas(desk.dir)}>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-5">{children}</div>
        </AreaTones>
      </AppShell>
      <DeskCommands data={commands} />
      <Toaster />
      <Live base={desk.base} />
    </Owner>
  )
}
