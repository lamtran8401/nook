import type { HomeView } from '@nook/core/read.ts'
import type { BriefItem, BriefLine } from '@nook/desk/desks.ts'

import { Cmd } from './Cmd.tsx'
import { Move } from './item/Move.tsx'
import { StateIcon, StateTag } from './Marks.tsx'

const GATE = /^\/gate (approve|accept) (\S+)$/
const ANSWER = /^nook eng answer (\S+) /

const capital = (words: string) => words.charAt(0).toUpperCase() + words.slice(1)

/** The words of a line under the head of its item: the item id goes, since the head names it. */
function wordsOf(line: BriefLine): string {
  const id = line.item ? `${line.item.id} ` : null
  return id && line.text.startsWith(id) ? capital(line.text.slice(id.length)) : line.text
}

/** The one-click part of a line: a gate runs from its button, an answer opens the item with its questions. */
function LineAction({ action }: { action?: string | undefined }) {
  const gate = action ? GATE.exec(action) : null
  if (gate)
    return (
      <Move fields={{ kind: 'gate', item: gate[2]!, move: gate[1]! }}>
        <button type="submit" className="bn-btn" data-variant="primary" data-size="sm">{capital(gate[1]!)}</button>
      </Move>
    )
  const answer = action ? ANSWER.exec(action) : null
  return answer ? <a className="bn-btn" data-variant="primary" data-size="sm" href={`/works/${answer[1]}`}>Answer</a> : null
}

function ItemHead({ item }: { item: BriefItem }) {
  return (
    <a className="nk-group__head" href={`/works/${item.id}`}>
      <StateIcon state={item.state} />
      <span className="nk-group__id">{item.id}</span>
      <span className="nk-group__title">{item.title}</span>
      <StateTag state={item.state} />
    </a>
  )
}

type Group = { item?: BriefItem | undefined; lines: BriefLine[] }

/** The lines in groups by item, in the order that each item first comes; the lines of no item make one group. */
function groupsOf(lines: BriefLine[]): Group[] {
  const groups = new Map<string, Group>()
  for (const line of lines) {
    const key = line.item?.id ?? ''
    const group = groups.get(key) ?? { item: line.item, lines: [] }
    group.lines.push(line)
    groups.set(key, group)
  }
  return [...groups.values()]
}

function Waits({ lines }: { lines: BriefLine[] }) {
  return (
    <div className="nk-groups">
      {groupsOf(lines).map(group => (
        <div className="bn-card nk-group" key={group.item?.id ?? 'desk'}>
          {group.item ? <ItemHead item={group.item} /> : <div className="nk-group__head">This desk</div>}
          <ul className="nk-lines">
            {group.lines.map(line => (
              <li className="nk-line" key={`${line.text}${line.action}`}>
                <span className="nk-line__ico" data-tone={line.urgent ? 'danger' : 'warning'} aria-label={line.urgent ? 'urgent' : 'today'}>!</span>
                <div className="nk-line__words">
                  <p>{wordsOf(line)}</p>
                  {line.action ? <Cmd text={line.action} /> : null}
                </div>
                <LineAction action={line.action} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

/** What runs or is done: one row for each line, with the item and the command of the lead. */
function Rows({ lines }: { lines: BriefLine[] }) {
  return (
    <div className="bn-card nk-group">
      {lines.map(line => (
        <div className="nk-group__row" key={`${line.text}${line.action}`}>
          {line.item ? <ItemHead item={line.item} /> : <p className="nk-group__head">{line.text}</p>}
          {line.action ? <Cmd text={line.action} /> : null}
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

/** The home page: the counts of the brief on top, then what waits in groups by item, what runs and what is done. */
export function HomeBrief({ view }: { view: HomeView }) {
  const waits = view.brief.filter(l => l.part === 'waits').sort((a, b) => Number(b.urgent ?? false) - Number(a.urgent ?? false))
  const runs = view.brief.filter(l => l.part === 'runs')
  const done = view.brief.filter(l => l.part === 'done')
  return (
    <>
      <div className="nk-tiles">
        {TILES.map(tile => (
          <div className="bn-card nk-tile" data-tone={tile.tone} key={tile.label}>
            <b>{tile.count(view.brief)}</b>
            <span>{tile.label}</span>
          </div>
        ))}
      </div>
      {waits.length ? (
        <section className="nk-sec">
          <h2 className="nk-h2">Waits for you</h2>
          <Waits lines={waits} />
        </section>
      ) : (
        <p className="nk-lead">Nothing waits for you.</p>
      )}
      {runs.length ? (
        <section className="nk-sec">
          <h2 className="nk-h2">Runs</h2>
          <Rows lines={runs} />
        </section>
      ) : null}
      {done.length ? (
        <section className="nk-sec">
          <h2 className="nk-h2">Done since yesterday</h2>
          <Rows lines={done} />
        </section>
      ) : null}
    </>
  )
}
