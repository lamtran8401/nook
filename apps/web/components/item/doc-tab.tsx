import { FileText } from 'lucide-react'

import type { Criterion } from '@nook/engineering/stores/criteria.ts'
import type { Slice } from '@nook/engineering/stores/slices.ts'
import { CopyCommand } from '@nook/ui/components/copy-command.tsx'
import { EmptyState } from '@nook/ui/components/empty-state.tsx'
import { Prose } from '@nook/ui/components/prose.tsx'

import { Blocks } from '@/components/blocks/blocks.tsx'
import { Lanes } from '@/components/item/lanes.tsx'
import { parseDoc } from '@/lib/blocks.ts'

export type DocName = 'spec' | 'plan' | 'tasks' | 'walkthrough'

// what writes a document not written yet: the words before the command, and the command to type in the agent session
const WRITES: Record<DocName, [before: string, command: string]> = {
  spec: ['The spec comes first. Type', '/spec'],
  plan: ['The plan comes after the spec. Type', '/recipe'],
  tasks: ['The slices come with the plan. Type', '/recipe'],
  walkthrough: ['The walkthrough comes after the build. When the item reaches review, type', '/view'],
}

/** One document of the item, rendered in full, block by block, the tasks with the lanes of the slices first; a document not written yet says what writes it. */
export function DocTab({ id, name, text, areas, criteria, slices = [] }: { id: string; name: DocName; text: string | null; areas: string[]; criteria: Criterion[]; slices?: Slice[] }) {
  if (text === null)
    return (
      <EmptyState icon={<FileText className="size-5" aria-hidden="true" />} title={`The ${name} is not written yet`}>
        {WRITES[name][0]} <CopyCommand text={`${WRITES[name][1]} ${id}`} /> in the agent session.
      </EmptyState>
    )
  const doc = parseDoc(text, { places: areas })
  const dates = ['created', 'updated'].filter(key => doc.meta[key]).map(key => `${key} ${doc.meta[key]}`)
  return (
    <article className="grid gap-3">
      <p className="font-mono text-xs text-muted-foreground">{[`works/${id}/${name}.md`, ...dates].join(' · ')}</p>
      {doc.title ? <h2 className="text-2xl font-bold tracking-tight">{doc.title}</h2> : null}
      {name === 'tasks' ? <Lanes slices={slices} /> : null}
      <Prose>
        <Blocks blocks={doc.blocks} context={{ criteria }} />
      </Prose>
    </article>
  )
}
