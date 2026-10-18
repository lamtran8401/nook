import type { HomeView } from '@nook/core/read.ts'
import type { BriefLine } from '@nook/desk/desks.ts'

const PARTS: { part: BriefLine['part']; title: string }[] = [
  { part: 'waits', title: 'Waits for you' },
  { part: 'done', title: 'Done since yesterday' },
  { part: 'runs', title: 'Runs' },
]

const lineLook = (line: BriefLine) => (line.part === 'done' ? { tone: 'success', icon: '✓' } : line.part === 'runs' ? { tone: 'primary', icon: '›' } : line.urgent ? { tone: 'danger', icon: '!' } : { tone: 'warning', icon: '·' })

function Row({ tone, icon, text, note }: { tone: string; icon: string; text: string; note?: string | undefined }) {
  return (
    <li>
      <span className="bn-actions__ico" data-tone={tone}>{icon}</span>
      <div>
        <b>{text}</b>
        {note ? <small>{note}</small> : null}
      </div>
      <span />
    </li>
  )
}

function Part({ title, lines }: { title: string; lines: BriefLine[] }) {
  return (
    <section className="nk-sec">
      <h2 className="nk-h2">{title}</h2>
      <ul className="bn-card bn-actions nk-rows">
        {lines.map(line => (
          <Row key={`${line.text}${line.action}`} {...lineLook(line)} text={line.text} note={line.action} />
        ))}
      </ul>
    </section>
  )
}

/** The home page: the parts of `nook brief`. A gap of `nook doctor` is an urgent wait there, on top with its fix. */
export function HomeBrief({ view }: { view: HomeView }) {
  const parts = PARTS.map(({ part, title }) => ({ title, lines: view.brief.filter(l => l.part === part).sort((a, b) => Number(b.urgent ?? false) - Number(a.urgent ?? false)) }))
  return (
    <>
      {parts[0]!.lines.length ? null : <p className="nk-lead">Nothing waits for you.</p>}
      {parts.filter(p => p.lines.length).map(p => (
        <Part key={p.title} {...p} />
      ))}
    </>
  )
}
