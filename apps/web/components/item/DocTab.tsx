import type { Criterion } from '@nook/engineering/stores/criteria.ts'

import { parseDoc } from '../../lib/blocks.ts'
import { Alert, PANEL } from '../Alert.tsx'
import { Blocks } from '../blocks/Blocks.tsx'

export type DocName = 'spec' | 'plan' | 'tasks' | 'walkthrough'

// what to type in the agent session for a document that is not written yet
const WRITES: Record<DocName, (id: string) => string> = {
  spec: id => `The spec comes first. Type /spec ${id} in the agent session.`,
  plan: id => `The plan comes after the spec. Type /recipe ${id} in the agent session.`,
  tasks: id => `The slices come with the plan. Type /recipe ${id} in the agent session.`,
  walkthrough: id => `The walkthrough comes after the build. When the item reaches review, type /view ${id} in the agent session.`,
}

/** One document of the item, rendered in full, block by block; a document not written yet says what writes it. */
export function DocTab({ id, name, text, areas, criteria }: { id: string; name: DocName; text: string | null; areas: string[]; criteria: Criterion[] }) {
  if (text === null)
    return (
      <Alert {...PANEL.info} label={`The ${name} is not written yet`}>
        {WRITES[name](id)}
      </Alert>
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
