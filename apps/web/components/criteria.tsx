import type { ReactNode } from 'react'

import { Badge } from '@nook/ui/components/badge.tsx'
import { RecordList } from '@nook/ui/components/record-list.tsx'

import { CRITERION_TONE as TAG_TONE } from '@/components/tones.ts'
import { CRITERION_TONE, type CriterionState } from '@/lib/progress.ts'

/**
 * One criterion of a spec: its tag, its words, the sources it rests on, such as `ticket AC1`, the slices that prove
 * it, and its state; a criterion with no state has no row in the ledger and no item to read it for.
 */
export type CriterionLine = { n: number; tag: string; content: ReactNode; refs?: string[]; state?: CriterionState; evidence?: string | null; proof?: string[] }

function Sources({ line }: { line: CriterionLine }) {
  const refs = line.refs ?? []
  const proof = line.proof ?? []
  if (!refs.length && !proof.length && !line.evidence) return null
  return (
    <span className="flex flex-wrap items-center gap-1.5 text-[12.5px]">
      {refs.map(ref => (
        <Badge key={ref} variant="outline" className="font-mono">{ref}</Badge>
      ))}
      {proof.length ? <span>proved by {proof.join(', ')}</span> : null}
      {line.state === 'met' && line.evidence ? <span>· {line.evidence}</span> : null}
    </span>
  )
}

/** The acceptance criteria, each with its number, its tag, its words, its sources and the slices that prove it, and its state. */
export function CriteriaList({ lines }: { lines: CriterionLine[] }) {
  return (
    <RecordList
      rows={lines.map(line => ({
        id: `AC${line.n}`,
        main: (
          <>
            {line.tag ? <Badge tone={TAG_TONE[line.tag]} className="mr-2 align-[1px]">{line.tag}</Badge> : null}
            {line.content}
          </>
        ),
        sub: <Sources line={line} />,
        end: line.state ? <Badge tone={CRITERION_TONE[line.state]}>{line.state}</Badge> : undefined,
      }))}
    />
  )
}
