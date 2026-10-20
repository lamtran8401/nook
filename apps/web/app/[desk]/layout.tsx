import { headers } from 'next/headers'
import type { ReactNode } from 'react'

import { AppRail } from '@nook/ui/components/app-rail.tsx'
import { AppShell } from '@nook/ui/components/app-shell.tsx'

import { AreaTones } from '@/components/areas.tsx'
import { DeskNav } from '@/components/desk-nav.tsx'
import { Live } from '@/components/live.tsx'
import { Owner, ViewerNote } from '@/components/owner.tsx'
import { deskAreas, deskPages, openCount, openDesk } from '@/lib/desk.ts'
import { listDesks } from '@/lib/desks.ts'
import { OWNER_HEADER } from '@/lib/gate.ts'

export const dynamic = 'force-dynamic'

const DESK_TONES = ['primary', 'violet', 'aqua', 'warning', 'success', 'danger']

type Props = { children: ReactNode; params: Promise<{ desk: string }> }

export async function generateMetadata({ params }: Pick<Props, 'params'>) {
  return { title: `Nook · ${(await openDesk(params)).name}` }
}

/** The shell of a desk: the rail of the desks, the side nav of its pages, then the page. The gate says if the browser is paired. */
export default async function DeskLayout({ children, params }: Props) {
  const desk = await openDesk(params)
  const paired = (await headers()).get(OWNER_HEADER) === '1'
  const rail = listDesks().map((d, i) => ({ name: d.name, href: `/${d.slug}`, tone: DESK_TONES[i % DESK_TONES.length]!, active: d.slug === desk.slug }))
  const open = deskPages(desk.dir).some(page => page.key === 'works') ? openCount(desk.dir) : undefined
  const pages = deskPages(desk.dir).map(page => ({ key: page.key, label: page.label, href: `${desk.base}${page.path}`, ...(page.footer ? { footer: true } : {}), ...(page.key === 'works' && open !== undefined ? { count: open } : {}) }))
  return (
    <AppShell rail={<AppRail desks={rail} />} nav={<DeskNav title={desk.name} base={desk.base} pages={pages} />}>
      <Owner paired={paired}>
        <ViewerNote />
        <AreaTones names={deskAreas(desk.dir)}>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-5">{children}</div>
        </AreaTones>
      </Owner>
      <Live base={desk.base} />
    </AppShell>
  )
}
