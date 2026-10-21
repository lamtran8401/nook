import { FileText } from 'lucide-react'

import type { DocName } from '@nook/engineering/read/reader.ts'
import type { Criterion } from '@nook/engineering/stores/criteria.ts'
import type { Slice } from '@nook/engineering/stores/slices.ts'
import { CopyCommand } from '@nook/ui/components/copy-command.tsx'
import { DocFrame } from '@nook/ui/components/doc-frame.tsx'
import { EmptyState } from '@nook/ui/components/empty-state.tsx'
import { Prose } from '@nook/ui/components/prose.tsx'

import { Blocks } from '@/components/blocks/blocks.tsx'
import { DOC_ABOUT } from '@/components/item/item-aside.tsx'
import { Lanes } from '@/components/item/lanes.tsx'
import { parseDoc } from '@/lib/blocks.ts'

// what writes a document not written yet: the words before the command, and the command to type in the agent session
const WRITES: Record<DocName, [before: string, command: string]> = {
  spec: ['The spec comes first. Type', '/spec'],
  'root-cause': ['The root cause comes with the build of a fix. Type', '/cook'],
  plan: ['The plan comes after the spec. Type', '/recipe'],
  tasks: ['The slices come with the plan. Type', '/recipe'],
  walkthrough: ['The walkthrough comes after the build. When the item reaches review, type', '/view'],
  findings: ['The findings come with the work of the investigation. Type', '/cook'],
}

/**
 * One document of the item on its card, block by block, the tasks with the lanes of the slices first. The page head
 * names the item, so the title of the document is left out. A document not written yet says what writes it.
 */
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
    <DocFrame path={`works/${id}/${DOC_ABOUT[name].file}`} meta={dates.length ? <span className="font-mono">{dates.join(' · ')}</span> : null}>
      {name === 'tasks' ? <Lanes slices={slices} /> : null}
      <Prose>
        <Blocks blocks={doc.blocks} context={{ criteria }} />
      </Prose>
    </DocFrame>
  )
}
