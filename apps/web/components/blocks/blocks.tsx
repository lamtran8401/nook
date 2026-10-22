import { match } from 'ts-pattern'

import type { Criterion } from '@nook/engineering/stores/criteria.ts'
import type { Item } from '@nook/engineering/stores/items.ts'
import type { Slice } from '@nook/engineering/stores/slices.ts'
import { Badge } from '@nook/ui/components/badge.tsx'
import { Callout } from '@nook/ui/components/callout.tsx'
import { Checklist } from '@nook/ui/components/checklist.tsx'
import { CodeBlock } from '@nook/ui/components/code-block.tsx'
import { Disclosure } from '@nook/ui/components/disclosure.tsx'
import { Legend } from '@nook/ui/components/legend.tsx'
import { OutList } from '@nook/ui/components/out-list.tsx'
import { PieceGrid } from '@nook/ui/components/piece-grid.tsx'
import { Quote } from '@nook/ui/components/quote.tsx'
import { RuleList } from '@nook/ui/components/rule-list.tsx'
import { Separator } from '@nook/ui/components/separator.tsx'
import { StepList } from '@nook/ui/components/step-list.tsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@nook/ui/components/table.tsx'
import { TaskCard } from '@nook/ui/components/task-card.tsx'

import { AreaTags } from '@/components/areas.tsx'
import { Inline } from '@/components/blocks/inline.tsx'
import { PANEL } from '@/components/blocks/panel.ts'
import { CriteriaList } from '@/components/criteria.tsx'
import { Diagram } from '@/components/diagram.tsx'
import type { Block, Source } from '@/lib/blocks.ts'
import { capitalized } from '@/lib/inline.ts'
import { type CriterionState, criterionState } from '@/lib/progress.ts'

/** One part of the kit for each kind of block. The context brings what the ledger knows, such as the state of each criterion. */

/** What the ledger knows beside a document: the criteria, the slices that prove them, and the step of the item. */
export type DocContext = { criteria?: Criterion[]; slices?: Slice[]; item?: Pick<Item, 'state' | 'blocked_from'> }

const LEVEL_TONE: Record<string, string> = { low: 'neutral', med: 'warning', high: 'danger' }

/** A rule takes the tone of its strongest source: a guess by its impact, an open question in warning. */
function ruleTone(sources: Source[]): string | undefined {
  const levels = sources.flatMap(s => (s.level ? [s.level] : []))
  if (levels.includes('high')) return 'danger'
  if (levels.includes('med') || sources.some(s => s.text === 'open')) return 'warning'
  return undefined
}

function SourceBadge({ source }: { source: Source }) {
  if (source.level) return <Badge tone={LEVEL_TONE[source.level]}>{`${source.text} · ${source.level}`}</Badge>
  return source.text === 'open' ? <Badge tone="warning">open</Badge> : <Badge variant="outline">{source.text}</Badge>
}

/** The state of a criterion for its item; a spec with no item, such as a page of the wiki, gives none. */
function stateOf(n: number, context: DocContext): { state?: CriterionState } {
  if (!context.item) return {}
  const row = context.criteria?.find(c => c.n === n) ?? { n, done: false }
  return { state: criterionState(row, context.slices ?? [], context.item.state, context.item.blocked_from) }
}

const align = (side: string | null | undefined) => (side ? { textAlign: side as 'left' | 'center' | 'right' } : undefined)

function BlockView({ block, context }: { block: Block; context: DocContext }) {
  return match(block)
    .with({ kind: 'heading' }, b => {
      const Heading = `h${Math.min(b.depth, 6)}` as 'h2'
      return <Heading><Inline content={b.content} /></Heading>
    })
    .with({ kind: 'paragraph' }, b => <p><Inline content={b.content} /></p>)
    .with({ kind: 'list' }, b => {
      const items = b.items.map((item, i) => <li key={i}><Blocks blocks={item} context={context} /></li>)
      return b.ordered ? <ol start={b.start === 1 ? undefined : b.start}>{items}</ol> : <ul>{items}</ul>
    })
    .with({ kind: 'tasks' }, b => <Checklist items={b.items.map(item => ({ done: item.checked, content: <Blocks blocks={item.blocks} context={context} /> }))} />)
    .with({ kind: 'divider' }, () => <Separator />)
    .with({ kind: 'table' }, b => (
      <Table>
        <TableHeader>
          <TableRow>{b.head.map((cell, i) => <TableHead key={i} style={align(b.align[i])}><Inline content={cell} /></TableHead>)}</TableRow>
        </TableHeader>
        <TableBody>
          {b.rows.map((row, r) => <TableRow key={r}>{row.map((cell, i) => <TableCell key={i} style={align(b.align[i])}><Inline content={cell} /></TableCell>)}</TableRow>)}
        </TableBody>
      </Table>
    ))
    .with({ kind: 'quote' }, b => <Quote><Blocks blocks={b.blocks} context={context} /></Quote>)
    .with({ kind: 'code' }, b => <CodeBlock lang={b.lang ?? undefined} text={b.text} />)
    .with({ kind: 'diagram' }, b =>
      b.legend ? (
        <figure className="m-0 grid gap-2.5">
          <Diagram spec={b.spec} />
          <figcaption><Legend items={b.legend} /></figcaption>
        </figure>
      ) : (
        <Diagram spec={b.spec} />
      ),
    )
    .with({ kind: 'panel' }, b => <Callout {...PANEL[b.tone]}><Blocks blocks={b.blocks} context={context} /></Callout>)
    .with({ kind: 'decision' }, b => <Callout tone="primary" icon="◆" label="Decision"><Blocks blocks={b.blocks} context={context} /></Callout>)
    .with({ kind: 'expand' }, b => <Disclosure summary={b.title}><Blocks blocks={b.blocks} context={context} /></Disclosure>)
    .with({ kind: 'columns' }, b => (
      <div className="grid gap-4 md:grid-flow-col md:auto-cols-fr">
        {b.columns.map((column, i) => <div key={i} className="grid content-start gap-3"><Blocks blocks={column} context={context} /></div>)}
      </div>
    ))
    .with({ kind: 'unknown' }, b => (
      <Callout tone="warning" icon="!" label="This block was not shown">
        {`${b.reason.charAt(0).toUpperCase()}${b.reason.slice(1)} (line ${b.line}).`}
        {b.text ? <pre className="font-mono text-xs whitespace-pre-wrap">{b.text}</pre> : null}
      </Callout>
    ))
    .with({ kind: 'criteria' }, b => (
      <CriteriaList
        lines={b.items.map(item => {
          const row = context.criteria?.find(c => c.n === item.n)
          const proof = (context.slices ?? []).filter(s => s.acs.includes(item.n) && s.state !== 'cancelled').map(s => s.id)
          return { n: item.n, tag: item.tag, content: <Inline content={item.content} />, refs: item.refs, proof, evidence: row?.evidence ?? null, ...stateOf(item.n, context) }
        })}
      />
    ))
    .with({ kind: 'rules' }, b => (
      <RuleList rules={b.items.map(item => ({ label: item.label, content: <Inline content={item.content} />, tone: ruleTone(item.sources), end: item.sources.map((source, j) => <SourceBadge source={source} key={j} />) }))} />
    ))
    .with({ kind: 'pieces' }, b => <PieceGrid pieces={b.items.map(item => ({ title: item.title, content: <Inline content={capitalized(item.content)} /> }))} />)
    .with({ kind: 'steps' }, b => <StepList variant="path" items={b.items.map(item => ({ title: <Inline content={item.action} />, ...(item.seen.length ? { text: <Inline content={item.seen} /> } : {}) }))} />)
    .with({ kind: 'numbered' }, b => <StepList items={b.items.map(item => ({ title: <Inline content={item} /> }))} />)
    .with({ kind: 'outlist' }, b => <OutList items={b.items.map((item, i) => <Inline content={item} key={i} />)} />)
    .with({ kind: 'headsup' }, b => (
      <Callout tone="neutral" icon="!" label={`${b.items.length} ${b.items.length === 1 ? 'thing' : 'things'} to know`}>
        <ul className="list-disc pl-[1.3em]">{b.items.map((item, i) => <li key={i}><Inline content={item} /></li>)}</ul>
      </Callout>
    ))
    .with({ kind: 'met' }, b => <Checklist items={b.items.map(item => ({ done: true, content: <Inline content={item} /> }))} />)
    .with({ kind: 'callout' }, b =>
      b.tone === 'short'
        ? <Callout tone="primary" icon="i" label="In short"><Inline content={b.content} /></Callout>
        : <Callout tone="warning" icon="!" label="Need to know"><Inline content={b.content} /></Callout>,
    )
    .with({ kind: 'none' }, b => (
      <p className="flex flex-wrap items-center gap-1.5 text-[13px] text-muted-foreground">
        <span>No impact on</span>
        {b.kinds.map(kind => <Badge variant="outline" key={kind}>{kind}</Badge>)}
      </p>
    ))
    .with({ kind: 'task' }, b => (
      <TaskCard
        kicker={
          <>
            <span>{b.id}</span>
            {b.area ? <AreaTags names={[b.area]} /> : null}
            {b.size ? <span>size {b.size}</span> : null}
          </>
        }
        title={b.title}
        rows={b.rows.map(([label, value]) => [label, <Inline content={value} key={label} />])}
        foot={b.depends === 'none' ? <Badge tone="success">starts first</Badge> : <Badge variant="outline">after {b.depends}</Badge>}
      />
    ))
    .with({ kind: 'finding' }, b => (
      <TaskCard
        kicker={<span>{b.id}</span>}
        title={b.title || b.id}
        rows={b.rows.map(([label, value]) => [label, <Inline content={value} key={label} />])}
        foot={<Badge tone={b.answered ? 'success' : 'warning'}>{b.answered ? 'answered' : 'open'}</Badge>}
      />
    ))
    .exhaustive()
}

export function Blocks({ blocks, context = {} }: { blocks: Block[]; context?: DocContext }) {
  return <>{blocks.map((block, i) => <BlockView block={block} context={context} key={i} />)}</>
}
