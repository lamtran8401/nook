import { Bot, Zap } from 'lucide-react'

import type { PackPart } from '@nook/desk/pack-parts.ts'
import { IconCard } from '@nook/ui/components/icon-card.tsx'
import { LinkTabs } from '@nook/ui/components/link-tabs.tsx'

// one color for each pack, so a card says its pack at a glance
const PACK_TONE: Record<string, string> = { core: 'ink', engineering: 'primary', 'issue-tracker': 'warning', wiki: 'aqua' }

function Cards({ title, parts, icon }: { title: string; parts: PackPart[]; icon: React.ReactNode }) {
  if (!parts.length) return null
  return (
    <section className="grid gap-2">
      <h2 className="text-xs font-medium text-muted-foreground">{title}</h2>
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {parts.map(part => (
          <IconCard key={`${part.pack}/${part.name}`} icon={icon} tone={PACK_TONE[part.pack] ?? 'neutral'} title={part.kind === 'skill' ? `/${part.name}` : part.name} description={part.job} tags={[part.pack]} />
        ))}
      </div>
    </section>
  )
}

/** The packs that give at least one part, in the order that the parts name them. */
export const packsOf = (parts: PackPart[]) => [...new Set(parts.map(part => part.pack))]

/** The agents and the skills of the packs on in the desk, a filter by pack on top; each a small card with its job and its pack. */
export function AgentsPage({ parts, pack, base }: { parts: PackPart[]; pack?: string | undefined; base: string }) {
  const shown = pack ? parts.filter(part => part.pack === pack) : parts
  const tabs = [undefined, ...packsOf(parts)].map(name => ({ href: name ? `${base}/agents?pack=${name}` : `${base}/agents`, label: name ?? 'all', current: name === pack }))
  return (
    <>
      <LinkTabs tabs={tabs} label="Packs" variant="segment" />
      <Cards title="Agents" parts={shown.filter(p => p.kind === 'agent')} icon={<Bot aria-hidden="true" />} />
      <Cards title="Skills" parts={shown.filter(p => p.kind === 'skill')} icon={<Zap aria-hidden="true" />} />
    </>
  )
}
