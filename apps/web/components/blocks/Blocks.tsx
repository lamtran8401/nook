import type { CSSProperties } from 'react'
import { match } from 'ts-pattern'

import type { Block, PanelTone } from '../../lib/blocks.ts'
import { Diagram } from '../Diagram.tsx'
import { Inline } from './Inline.tsx'

/** One Bench template for each kind of block. */

const PANEL: Record<PanelTone, { tone: string; icon: string; label: string }> = {
  info: { tone: 'primary', icon: 'i', label: 'Info' },
  note: { tone: 'neutral', icon: '✎', label: 'Note' },
  success: { tone: 'success', icon: '✓', label: 'Success' },
  warning: { tone: 'warning', icon: '!', label: 'Warning' },
  error: { tone: 'danger', icon: '×', label: 'Error' },
}

function Alert({ tone, icon, label, kind, children }: { tone: string; icon: string; label: string; kind?: string; children: React.ReactNode }) {
  return (
    <div className="bn-alert" data-tone={tone} data-kind={kind}>
      <div className="bn-alert__icon">{icon}</div>
      <div>
        <div className="bn-alert__label">{label}</div>
        <div className="bn-alert__body">{children}</div>
      </div>
    </div>
  )
}

function BlockView({ block }: { block: Block }) {
  return match(block)
    .with({ kind: 'heading' }, b => {
      const Tag = `h${Math.min(b.depth, 6)}` as 'h2'
      return <Tag><Inline content={b.content} /></Tag>
    })
    .with({ kind: 'paragraph' }, b => <p><Inline content={b.content} /></p>)
    .with({ kind: 'list' }, b => {
      const items = b.items.map((item, i) => <li key={i}><Blocks blocks={item} /></li>)
      return b.ordered ? <ol start={b.start === 1 ? undefined : b.start}>{items}</ol> : <ul>{items}</ul>
    })
    .with({ kind: 'tasks' }, b => (
      <ul className="bn-checklist__list">
        {b.items.map((item, i) => (
          <li className="bn-checklist__item" data-state={item.checked ? 'done' : undefined} key={i}>
            <span className="bn-checklist__box">{item.checked ? '✓' : ''}</span>
            <span className="bn-checklist__text"><Blocks blocks={item.blocks} /></span>
          </li>
        ))}
      </ul>
    ))
    .with({ kind: 'divider' }, () => <hr />)
    .with({ kind: 'table' }, b => (
      <div className="bn-table-wrap">
        <table className="bn-table">
          <thead><tr>{b.head.map((cell, i) => <th key={i} style={b.align[i] ? { textAlign: b.align[i]! } : undefined}><Inline content={cell} /></th>)}</tr></thead>
          <tbody>{b.rows.map((row, r) => <tr key={r}>{row.map((cell, i) => <td key={i} style={b.align[i] ? { textAlign: b.align[i]! } : undefined}><Inline content={cell} /></td>)}</tr>)}</tbody>
        </table>
      </div>
    ))
    .with({ kind: 'quote' }, b => <figure className="bn-quote"><blockquote><Blocks blocks={b.blocks} /></blockquote></figure>)
    .with({ kind: 'code' }, b => (
      <figure className="bn-code">
        {b.lang ? <div className="bn-code__head"><span>{b.lang}</span></div> : null}
        <pre><code>{b.text}</code></pre>
      </figure>
    ))
    .with({ kind: 'diagram' }, b => <Diagram spec={b.spec} />)
    .with({ kind: 'panel' }, b => <Alert {...PANEL[b.tone]}><Blocks blocks={b.blocks} /></Alert>)
    .with({ kind: 'decision' }, b => <Alert tone="primary" icon="◆" label="Decision" kind="decision"><Blocks blocks={b.blocks} /></Alert>)
    .with({ kind: 'expand' }, b => (
      <div className="bn-accordion">
        <details>
          <summary>{b.title}</summary>
          <div className="bn-accordion__body"><Blocks blocks={b.blocks} /></div>
        </details>
      </div>
    ))
    .with({ kind: 'columns' }, b => (
      <div className="bn-grid" style={{ '--cols': b.columns.length } as CSSProperties}>
        {b.columns.map((column, i) => <div key={i}><Blocks blocks={column} /></div>)}
      </div>
    ))
    .with({ kind: 'unknown' }, b => (
      <Alert tone="warning" icon="!" label="This block was not shown">
        {`${b.reason.charAt(0).toUpperCase()}${b.reason.slice(1)} (line ${b.line}).`}
        {b.text ? <pre>{b.text}</pre> : null}
      </Alert>
    ))
    .exhaustive()
}

export function Blocks({ blocks }: { blocks: Block[] }) {
  return <>{blocks.map((block, i) => <BlockView block={block} key={i} />)}</>
}
