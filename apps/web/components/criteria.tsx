import type { ReactNode } from 'react'

import { Badge } from '@nook/ui/components/badge.tsx'
import { CriterionCards } from '@nook/ui/components/criterion-cards.tsx'

import { CRITERION_TONE } from '@/components/tones.ts'
import { CRITERION_STATE_TONE, type CriterionState } from '@/lib/progress.ts'

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
    <>
      {refs.map(ref => (
        <Badge key={ref} variant="outline" className="font-mono">{ref}</Badge>
      ))}
      {proof.length ? <span>proved by {proof.join(', ')}</span> : null}
      {line.state === 'met' && line.evidence ? <span>· {line.evidence}</span> : null}
    </>
  )
}

/** The acceptance criteria, each on its card with its number, its tag, its words, its sources and the slices that prove it, and its state. */
export function CriteriaList({ lines }: { lines: CriterionLine[] }) {
  return (
    <CriterionCards
      items={lines.map(line => ({
        n: line.n,
        content: line.content,
        meta: <Sources line={line} />,
        ...(line.tag ? { tag: { text: line.tag, tone: CRITERION_TONE[line.tag] ?? 'neutral' } } : {}),
        ...(line.state ? { state: { text: line.state, tone: CRITERION_STATE_TONE[line.state], done: line.state === 'met' } } : {}),
      }))}
    />
  )
}
