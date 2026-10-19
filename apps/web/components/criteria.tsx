import type { ReactNode } from 'react'

import type { Criterion } from '@nook/engineering/stores/criteria.ts'

import { Records } from '@/components/records.tsx'
import { CRITERION_TONE, criterionTag } from '@/components/tones.ts'

/** One criterion as a row: its tag, its words and the cases it rests on; `met` is unknown when the ledger has no row for it. */
export type CriterionLine = { n: number; tag: string; content: ReactNode; refs?: string[]; met?: boolean; evidence?: string | null }

/** The acceptance criteria, each with its number, its tag, its words, whether it is met and its evidence. */
export function CriteriaList({ lines }: { lines: CriterionLine[] }) {
  return (
    <Records
      rows={lines.map(line => ({
        id: `AC${line.n}`,
        main: (
          <>
            {line.tag ? <span className="bn-badge" data-tone={CRITERION_TONE[line.tag]}>{line.tag}</span> : null}
            {line.content}
            {line.refs?.length ? <span className="bn-records__meta"> {line.refs.join(', ')}</span> : null}
          </>
        ),
        sub: line.met && line.evidence ? line.evidence : undefined,
        end: line.met === undefined ? undefined : <span className="bn-badge" data-tone={line.met ? 'success' : 'neutral'}>{line.met ? 'met' : 'open'}</span>,
      }))}
    />
  )
}

/** The criteria as the ledger keeps them; the ledger keeps the tag in the words, such as `[ADD] the export has the right date`. */
export function Criteria({ criteria }: { criteria: Criterion[] }) {
  return (
    <CriteriaList
      lines={criteria.map(c => {
        const { tag, words } = criterionTag(c.text)
        return { n: c.n, tag, content: words, met: c.done, evidence: c.evidence }
      })}
    />
  )
}
