import { Bot, Sparkles } from 'lucide-react'

import type { PackPart } from '@nook/desk/pack-parts.ts'
import { IconCard } from '@nook/ui/components/icon-card.tsx'
import { SectionHeader } from '@nook/ui/components/section-header.tsx'

// one color for each pack, so a card says its pack at a glance
const PACK_TONE: Record<string, string> = { core: 'ink', engineering: 'primary', 'issue-tracker': 'warning', wiki: 'aqua', learn: 'violet' }

function Cards({ title, parts, icon }: { title: string; parts: PackPart[]; icon: React.ReactNode }) {
  return (
    <section className="grid gap-3">
      <SectionHeader title={title} count={parts.length} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {parts.map(part => (
          <IconCard key={`${part.pack}/${part.name}`} icon={icon} tone={PACK_TONE[part.pack] ?? 'neutral'} title={part.name} description={part.job} tags={[part.pack]} />
        ))}
      </div>
    </section>
  )
}

/** The agents and the skills of the packs on in the desk, each a card with its job and its pack. */
export function AgentsPage({ parts }: { parts: PackPart[] }) {
  return (
    <>
      <Cards title="Agents" parts={parts.filter(p => p.kind === 'agent')} icon={<Bot aria-hidden="true" />} />
      <Cards title="Skills" parts={parts.filter(p => p.kind === 'skill')} icon={<Sparkles aria-hidden="true" />} />
    </>
  )
}
