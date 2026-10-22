import type { BriefLine } from '@nook/desk/desks.ts'
import type { BoardCard, Receipt } from '@nook/engineering/read/reader.ts'
import type { Metrics, Share, Times } from '@nook/engineering/report/metrics.ts'
import type { Question } from '@nook/engineering/stores/questions.ts'
import { Button } from '@nook/ui/components/button.tsx'
import { CopyCommand } from '@nook/ui/components/copy-command.tsx'
import { Kbd } from '@nook/ui/components/kbd.tsx'
import { SegmentBar } from '@nook/ui/components/segment-bar.tsx'
import { Tally } from '@nook/ui/components/tally.tsx'
import { Tile } from '@nook/ui/components/tile.tsx'
import { TrendTile } from '@nook/ui/components/trend-tile.tsx'

import { AnswerForm } from '@/components/item/answer-forms.tsx'
import { Move } from '@/components/item/move.tsx'
import { Timeline } from '@/components/item/timeline.tsx'
import { InboxList, type InboxListRow } from '@/components/inbox-list.tsx'
import { STATE_TONE } from '@/components/tones.ts'
import { FLOW } from '@/lib/board.ts'
import { type InboxRowData, inboxRows } from '@/lib/inbox.ts'
import { median, NO_DATA, percent } from '@/lib/metric-text.ts'

const RECEIPTS = 10
const capital = (word: string) => word.charAt(0).toUpperCase() + word.slice(1)
const Muted = ({ children }: { children: string }) => <p className="text-[13px] text-muted-foreground">{children}</p>

/** The parts of a row that act: Review and the gate move with its key, the answer box, or the command to type under the line. */
function rowOf(row: InboxRowData, base: string, questions: Question[]): InboxListRow {
  const href = row.item ? `${base}/works/${row.item.id}` : undefined
  const fixed = { key: row.key, tone: row.tone, id: row.item?.id, sub: row.sub }
  const title = href ? <a href={href} className="hover:underline">{row.title}</a> : row.title
  if (row.gate && row.item)
    return {
      ...fixed,
      title,
      actions: (
        <>
          <Button asChild variant="secondary" size="sm">
            <a href={href}>Review</a>
          </Button>
          <Move fields={{ kind: 'gate', item: row.item.id, move: row.gate }}>
            <Button type="submit" size="sm" data-key="a">
              {capital(row.gate)} <Kbd>A</Kbd>
            </Button>
          </Move>
        </>
      ),
    }
  const question = questions.find(q => q.item === row.item?.id && q.id === row.question)
  if (question && row.item) return { ...fixed, title, below: <AnswerForm item={row.item.id} question={question} /> }
  return { ...fixed, title, ...(row.command ? { below: <CopyCommand text={row.command} /> } : {}) }
}

function Waits({ brief, questions, base }: { brief: BriefLine[]; questions: Question[]; base: string }) {
  const rows = inboxRows(brief)
  return (
    <Tile title="Waits for you" note={rows.length}>
      {rows.length ? (
        <>
          <p className="-mt-2 text-xs text-muted-foreground">J and K pick a row · A approves or accepts · R answers</p>
          <InboxList rows={rows.map(row => rowOf(row, base, questions))} />
        </>
      ) : (
        <Muted>Nothing waits for you.</Muted>
      )}
    </Tile>
  )
}

const shareOf = (s: Share) => (s.whole ? (100 * s.part) / s.whole : null)
const unitOf = (text: string) => (text === NO_DATA ? { value: text } : { value: text.replace(/\s.*$/, ''), unit: text.slice(text.indexOf(' ')) })

/** The four numbers of the flow over the last 30 days, each with its trend over the last six weeks. */
function Numbers({ metrics, trend }: { metrics: Metrics; trend: Metrics[] }) {
  const time = (t: Times) => (t.median === null ? { value: NO_DATA } : unitOf(median(t)))
  const pct = (s: Share) => (s.whole ? { value: percent(s).replace('%', ''), unit: '%' } : { value: NO_DATA })
  return (
    <div className="grid grid-cols-2 gap-3">
      <TrendTile label="Rework rate" {...pct(metrics.rework)} tone="danger" points={trend.map(w => shareOf(w.rework))} note={`${metrics.rework.part} of ${metrics.rework.whole} sent back`} />
      <TrendTile label="First pass" {...pct(metrics.firstPass)} tone="success" points={trend.map(w => shareOf(w.firstPass))} note={`${metrics.firstPass.part} of ${metrics.firstPass.whole} accepted`} />
      <TrendTile label="Cycle time" {...time(metrics.cycle)} tone="primary" points={trend.map(w => w.cycle.median)} note={`median of ${metrics.cycle.count} ${metrics.cycle.count === 1 ? 'item' : 'items'}`} />
      <TrendTile label="Approve wait" {...time(metrics.approveWait)} tone="violet" points={trend.map(w => w.approveWait.median)} note="your gate, median" />
    </div>
  )
}

function BoardTile({ cards, base }: { cards: BoardCard[]; base: string }) {
  const steps = FLOW.map(step => ({ step, count: cards.filter(card => card.state === step).length })).filter(part => part.count)
  return (
    <Tile title="Board" note={`${cards.length} items`}>
      <a href={`${base}/works`} aria-label="Open the board" className="block">
        <SegmentBar label="Items by step" parts={steps.map(part => ({ key: part.step, tone: STATE_TONE[part.step] ?? 'neutral', size: part.count }))} />
      </a>
      <Tally columns={3} rows={steps.map(part => ({ tone: STATE_TONE[part.step] ?? 'neutral', label: part.step, value: part.count }))} />
    </Tile>
  )
}

function Lines({ title, lines, empty, base }: { title: string; lines: BriefLine[]; empty: string; base: string }) {
  return (
    <Tile title={title} note={lines.length}>
      {lines.length ? (
        <ul className="grid gap-2 text-[13px]">
          {lines.map(line => (
            <li key={`${line.text}${line.action ?? ''}`} className="grid gap-1">
              {line.item ? (
                <a href={`${base}/works/${line.item.id}`} className="flex min-w-0 gap-2 hover:underline">
                  <span className="shrink-0 font-mono text-xs leading-5 text-muted-foreground">{line.item.id}</span>
                  <span className="min-w-0 truncate">{line.item.title}</span>
                </a>
              ) : (
                <span>{line.text}</span>
              )}
              {line.action ? <CopyCommand text={line.action} /> : null}
            </li>
          ))}
        </ul>
      ) : (
        <Muted>{empty}</Muted>
      )}
    </Tile>
  )
}

/** The home of a desk as an inbox: the moves that wait, acted on in place, the receipts of today, the numbers of the flow, the board, and what runs. */
export function Inbox({ brief, questions, metrics, trend, receipts, cards, base }: {
  brief: BriefLine[]
  questions: Question[]
  metrics: Metrics | null
  trend: Metrics[] | null
  receipts: Receipt[]
  cards: BoardCard[]
  base: string
}) {
  return (
    <div className="grid items-start gap-3 min-[1100px]:grid-cols-[minmax(0,1fr)_380px]">
      <div className="grid min-w-0 gap-3">
        <Waits brief={brief} questions={questions} base={base} />
        <Tile title="Receipts" note={`today · ${receipts.length}`}>
          {receipts.length ? <Timeline events={receipts.slice(0, RECEIPTS).map(r => ({ ...r, title: `${r.item} · ${r.title}` }))} /> : <Muted>Nothing happened today yet.</Muted>}
        </Tile>
      </div>
      <aside className="grid min-w-0 gap-3">
        {metrics && trend ? <Numbers metrics={metrics} trend={trend} /> : null}
        {cards.length ? <BoardTile cards={cards} base={base} /> : null}
        <Lines title="The lead runs" lines={brief.filter(l => l.part === 'runs')} empty="The lead runs nothing now." base={base} />
        <Lines title="Done since yesterday" lines={brief.filter(l => l.part === 'done')} empty="Nothing is done since yesterday." base={base} />
      </aside>
    </div>
  )
}
