import type { Criterion } from '@nook/engineering/stores/criteria.ts'

import { parseDoc } from '../../lib/blocks.ts'
import { Cmd } from '../Cmd.tsx'
import { EmptyState } from '../EmptyState.tsx'
import { Blocks } from '../blocks/Blocks.tsx'

export type DocName = 'spec' | 'plan' | 'tasks' | 'walkthrough'

// what writes a document not written yet: the words before the command, and the command to type in the agent session
const WRITES: Record<DocName, [before: string, command: string]> = {
  spec: ['The spec comes first. Type', '/spec'],
  plan: ['The plan comes after the spec. Type', '/recipe'],
  tasks: ['The slices come with the plan. Type', '/recipe'],
  walkthrough: ['The walkthrough comes after the build. When the item reaches review, type', '/view'],
}

/** One document of the item, rendered in full, block by block; a document not written yet says what writes it. */
export function DocTab({ id, name, text, areas, criteria }: { id: string; name: DocName; text: string | null; areas: string[]; criteria: Criterion[] }) {
  if (text === null)
    return (
      <EmptyState icon="file" title={`The ${name} is not written yet`}>
        {WRITES[name][0]} <Cmd text={`${WRITES[name][1]} ${id}`} /> in the agent session.
      </EmptyState>
    )
  const doc = parseDoc(text, { places: areas })
  const dates = ['created', 'updated'].filter(key => doc.meta[key]).map(key => `${key} ${doc.meta[key]}`)
  return (
    <article className="nk-doc">
      <p className="nk-doc__meta">{[`works/${id}/${name}.md`, ...dates].join(' · ')}</p>
      {doc.title ? <h2 className="nk-doc__title">{doc.title}</h2> : null}
      <div className="nk-doc__body">
        <Blocks blocks={doc.blocks} context={{ criteria }} />
      </div>
    </article>
  )
}
