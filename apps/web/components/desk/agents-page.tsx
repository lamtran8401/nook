import { Bot, Zap } from 'lucide-react'

import type { Part } from '@nook/desk/parts.ts'
import { IconCard } from '@nook/ui/components/icon-card.tsx'

function Cards({ title, parts, icon, tone }: { title: string; parts: Part[]; icon: React.ReactNode; tone: string }) {
  if (!parts.length) return null
  return (
    <section className="grid gap-2">
      <h2 className="text-xs font-medium text-muted-foreground">{title}</h2>
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {parts.map(part => (
          <IconCard key={part.name} icon={icon} tone={tone} title={part.kind === 'skill' ? `/${part.name}` : part.name} description={part.job} />
        ))}
      </div>
    </section>
  )
}

/** The agents and the skills of the plugin, each a small card with its job. */
export function AgentsPage({ parts }: { parts: Part[] }) {
  return (
    <>
      <Cards title="Agents" parts={parts.filter(p => p.kind === 'agent')} icon={<Bot aria-hidden="true" />} tone="primary" />
      <Cards title="Skills" parts={parts.filter(p => p.kind === 'skill')} icon={<Zap aria-hidden="true" />} tone="ink" />
    </>
  )
}
