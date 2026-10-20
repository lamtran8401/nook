import type { HomeView } from '@nook/core/read.ts'
import type { BriefItem, BriefLine } from '@nook/desk/desks.ts'
import { Button } from '@nook/ui/components/button.tsx'
import { CopyCommand } from '@nook/ui/components/copy-command.tsx'
import { CountTile } from '@nook/ui/components/count-tile.tsx'
import { Group, GroupLine } from '@nook/ui/components/group.tsx'
import { IconTile } from '@nook/ui/components/icon-tile.tsx'
import { SectionHeader } from '@nook/ui/components/section-header.tsx'

import { Move } from '@/components/item/move.tsx'
import { StateIcon, StateTag } from '@/components/marks.tsx'

const GATE = /^\/gate (approve|accept) (\S+)$/
const ANSWER = /^nook eng answer (\S+) /

const capital = (words: string) => words.charAt(0).toUpperCase() + words.slice(1)

/** The words of a line under the head of its item: the item id goes, since the head names it. */
function wordsOf(line: BriefLine): string {
  const id = line.item ? `${line.item.id} ` : null
  return id && line.text.startsWith(id) ? capital(line.text.slice(id.length)) : line.text
}

/** The one-click part of a line: a gate runs from its button, an answer opens the item with its questions. */
function LineAction({ action, base }: { action?: string | undefined; base: string }) {
  const gate = action ? GATE.exec(action) : null
  if (gate)
    return (
      <Move fields={{ kind: 'gate', item: gate[2]!, move: gate[1]! }}>
        <Button type="submit" size="sm">{capital(gate[1]!)}</Button>
      </Move>
    )
  const answer = action ? ANSWER.exec(action) : null
  return answer ? (
    <Button asChild size="sm">
      <a href={`${base}/works/${answer[1]}`}>Answer</a>
    </Button>
  ) : null
}

/** The head of the lines of one item: its state, id and title. */
function ItemHead({ item }: { item: BriefItem }) {
  return (
    <>
      <StateIcon state={item.state} />
      <span className="shrink-0 font-mono text-xs text-muted-foreground">{item.id}</span>
      <span className="min-w-0 truncate">{item.title}</span>
      <span className="ml-auto">
        <StateTag state={item.state} />
      </span>
    </>
  )
}

type LineGroup = { item?: BriefItem | undefined; lines: BriefLine[] }

/** The lines in groups by item, in the order that each item first comes; the lines of no item make one group. */
function groupsOf(lines: BriefLine[]): LineGroup[] {
  const groups = new Map<string, LineGroup>()
  for (const line of lines) {
    const key = line.item?.id ?? ''
    const group = groups.get(key) ?? { item: line.item, lines: [] }
    group.lines.push(line)
    groups.set(key, group)
  }
  return [...groups.values()]
}

function Waits({ lines, base }: { lines: BriefLine[]; base: string }) {
  return (
    <div className="grid gap-2.5">
      {groupsOf(lines).map(group => (
        <Group key={group.item?.id ?? 'desk'} head={group.item ? <ItemHead item={group.item} /> : 'This desk'} href={group.item ? `${base}/works/${group.item.id}` : undefined} indent>
          {group.lines.map(line => (
            <GroupLine
              key={`${line.text}${line.action}`}
              mark={<IconTile size="sm" tone={line.urgent ? 'danger' : 'warning'} label={line.urgent ? 'urgent' : 'today'}>!</IconTile>}
              end={<LineAction action={line.action} base={base} />}
            >
              <p className="text-sm">{wordsOf(line)}</p>
              {line.action ? <CopyCommand text={line.action} /> : null}
            </GroupLine>
          ))}
        </Group>
      ))}
    </div>
  )
}

/** What runs or is done: one row for each line, with the item and the command of the lead. */
function Rows({ lines, base }: { lines: BriefLine[]; base: string }) {
  return (
    <div className="divide-y divide-hairline overflow-hidden rounded-lg bg-card shadow-sm">
      {lines.map(line => (
        <div key={`${line.text}${line.action}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 pr-4 pl-4 sm:flex-nowrap">
          {line.item ? (
            <a href={`${base}/works/${line.item.id}`} className="flex min-w-0 flex-1 items-center gap-2 text-sm font-medium hover:underline">
              <ItemHead item={line.item} />
            </a>
          ) : (
            <p className="min-w-0 flex-1 text-sm font-medium">{line.text}</p>
          )}
          {line.action ? <CopyCommand text={line.action} /> : null}
        </div>
      ))}
    </div>
  )
}

const TILES: { label: string; tone: string; count: (lines: BriefLine[]) => number }[] = [
  { label: 'Urgent', tone: 'danger', count: lines => lines.filter(l => l.part === 'waits' && l.urgent).length },
  { label: 'Wait for you', tone: 'warning', count: lines => lines.filter(l => l.part === 'waits').length },
  { label: 'The lead runs', tone: 'primary', count: lines => lines.filter(l => l.part === 'runs').length },
  { label: 'Done since yesterday', tone: 'success', count: lines => lines.filter(l => l.part === 'done').length },
]

function Part({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section className="grid gap-3">
      <SectionHeader title={title} count={count} />
      {children}
    </section>
  )
}

/** The home page: the counts of the brief on top, then what waits in groups by item, what runs and what is done. */
export function HomeBrief({ view, base }: { view: HomeView; base: string }) {
  const waits = view.brief.filter(l => l.part === 'waits').sort((a, b) => Number(b.urgent ?? false) - Number(a.urgent ?? false))
  const runs = view.brief.filter(l => l.part === 'runs')
  const done = view.brief.filter(l => l.part === 'done')
  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {TILES.map(tile => (
          <CountTile key={tile.label} count={tile.count(view.brief)} label={tile.label} tone={tile.tone} />
        ))}
      </div>
      {waits.length ? <Part title="Waits for you" count={waits.length}><Waits lines={waits} base={base} /></Part> : <p className="text-[17px] font-medium">Nothing waits for you.</p>}
      {runs.length ? <Part title="Runs" count={runs.length}><Rows lines={runs} base={base} /></Part> : null}
      {done.length ? <Part title="Done since yesterday" count={done.length}><Rows lines={done} base={base} /></Part> : null}
    </>
  )
}
