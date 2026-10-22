import type { ReactNode } from 'react'

import { Card } from '@nook/ui/components/card.tsx'

/** The sections of a settings page in one card, a line between each. */
export function SettingRows({ children }: { children: ReactNode }) {
  return <Card className="gap-0 divide-y divide-hairline px-5 py-0">{children}</Card>
}

/** One section: its title and one muted line on the left, what it holds on the right. */
export function SettingRow({ title, about, children }: { title: string; about?: ReactNode; children: ReactNode }) {
  return (
    <section data-slot="setting-row" className="grid gap-x-6 gap-y-2 py-4 md:grid-cols-[200px_minmax(0,1fr)]">
      <div>
        <h2 className="text-[13.5px] font-semibold">{title}</h2>
        {about ? <p className="text-[12.5px] text-muted-foreground">{about}</p> : null}
      </div>
      <div className="min-w-0 text-[13.5px]">{children}</div>
    </section>
  )
}
