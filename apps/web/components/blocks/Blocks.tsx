import type { CSSProperties } from 'react'
import { match } from 'ts-pattern'

import type { Criterion } from '@nook/engineering/stores/criteria.ts'

import type { Block, Source } from '../../lib/blocks.ts'
import { capitalized } from '../../lib/inline.ts'
import { Alert, PANEL } from '../Alert.tsx'
import { Diagram } from '../Diagram.tsx'
import { CRITERION_TONE } from '../tones.ts'
import { Inline } from './Inline.tsx'

/** One Bench template for each kind of block. The context brings what the ledger knows, such as the state of each criterion. */

export type DocContext = { criteria?: Criterion[] }

const LEVEL_TONE: Record<string, string> = { low: 'neutral', med: 'warning', high: 'danger' }

function SourceBadge({ source }: { source: Source }) {
  if (source.level) return <span className="bn-badge" data-tone={LEVEL_TONE[source.level]}>{`${source.text} · ${source.level}`}</span>
  return <span className="bn-badge" data-tone={source.text === 'open' ? 'warning' : undefined} data-variant={source.text === 'open' ? undefined : 'plain'}>{source.text}</span>
}

function BlockView({ block, context }: { block: Block; context: DocContext }) {
  return match(block)
    .with({ kind: 'heading' }, b => {
      const Tag = `h${Math.min(b.depth, 6)}` as 'h2'
      return <Tag><Inline content={b.content} /></Tag>
    })
    .with({ kind: 'paragraph' }, b => <p><Inline content={b.content} /></p>)
    .with({ kind: 'list' }, b => {
      const items = b.items.map((item, i) => <li key={i}><Blocks blocks={item} context={context} /></li>)
      return b.ordered ? <ol start={b.start === 1 ? undefined : b.start}>{items}</ol> : <ul>{items}</ul>
    })
    .with({ kind: 'tasks' }, b => (
      <ul className="bn-checklist__list">
        {b.items.map((item, i) => (
          <li className="bn-checklist__item" data-state={item.checked ? 'done' : undefined} key={i}>
            <span className="bn-checklist__box">{item.checked ? '✓' : ''}</span>
            <span className="bn-checklist__text"><Blocks blocks={item.blocks} context={context} /></span>
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
    .with({ kind: 'quote' }, b => <figure className="bn-quote"><blockquote><Blocks blocks={b.blocks} context={context} /></blockquote></figure>)
    .with({ kind: 'code' }, b => (
      <figure className="bn-code">
        {b.lang ? <div className="bn-code__head"><span>{b.lang}</span></div> : null}
        <pre><code>{b.text}</code></pre>
      </figure>
    ))
    .with({ kind: 'diagram' }, b =>
      b.legend ? (
        <figure className="nk-figure">
          <Diagram spec={b.spec} />
          <figcaption>
            <span className="bn-legend">{b.legend.map(([tone, label]) => <span data-tone={tone} key={label}>{label}</span>)}</span>
          </figcaption>
        </figure>
      ) : (
        <Diagram spec={b.spec} />
      ),
    )
    .with({ kind: 'panel' }, b => <Alert {...PANEL[b.tone]}><Blocks blocks={b.blocks} context={context} /></Alert>)
    .with({ kind: 'decision' }, b => <Alert tone="primary" icon="◆" label="Decision" kind="decision"><Blocks blocks={b.blocks} context={context} /></Alert>)
    .with({ kind: 'expand' }, b => (
      <div className="bn-accordion">
        <details>
          <summary>{b.title}</summary>
          <div className="bn-accordion__body"><Blocks blocks={b.blocks} context={context} /></div>
        </details>
      </div>
    ))
    .with({ kind: 'columns' }, b => (
      <div className="bn-grid" style={{ '--cols': b.columns.length } as CSSProperties}>
        {b.columns.map((column, i) => <div key={i}><Blocks blocks={column} context={context} /></div>)}
      </div>
    ))
    .with({ kind: 'unknown' }, b => (
      <Alert tone="warning" icon="!" label="This block was not shown">
        {`${b.reason.charAt(0).toUpperCase()}${b.reason.slice(1)} (line ${b.line}).`}
        {b.text ? <pre>{b.text}</pre> : null}
      </Alert>
    ))
    .with({ kind: 'criteria' }, b => (
      <ol className="bn-records">
        {b.items.map(item => {
          const state = context.criteria?.find(c => c.n === item.n)
          return (
            <li key={item.n}>
              <span className="bn-records__id">AC{item.n}</span>
              <div>
                <div className="bn-records__head">
                  {item.tag ? <span className="bn-badge" data-tone={CRITERION_TONE[item.tag]}>{item.tag}</span> : null}
                  {item.refs.length ? <span className="bn-records__meta">{item.refs.join(', ')}</span> : null}
                  {state ? <span className="bn-badge bn-records__state" data-variant="solid" data-tone={state.done ? 'success' : 'neutral'}>{state.done ? 'met' : 'open'}</span> : null}
                </div>
                <p><Inline content={item.content} /></p>
              </div>
            </li>
          )
        })}
      </ol>
    ))
    .with({ kind: 'rules' }, b => (
      <ul className="bn-rules">
        {b.items.map((item, i) => (
          <li key={i}>
            <b>{item.label}</b>
            <p><Inline content={item.content} /></p>
            <span className="bn-rules__src">{item.sources.map((source, j) => <SourceBadge source={source} key={j} />)}</span>
          </li>
        ))}
      </ul>
    ))
    .with({ kind: 'pieces' }, b => (
      <div className="bn-pieces">
        {b.items.map((item, i) => (
          <article className="bn-piece" key={i}>
            <div className="bn-piece__head"><h3>{item.title}</h3></div>
            <p><Inline content={capitalized(item.content)} /></p>
          </article>
        ))}
      </div>
    ))
    .with({ kind: 'steps' }, b => (
      <ol className="bn-steplist" data-variant="path">
        {b.items.map((item, i) => (
          <li key={i}>
            <span className="bn-steplist__n">{i + 1}</span>
            <div>
              <b><Inline content={item.action} /></b>
              {item.seen.length ? <p><Inline content={item.seen} /></p> : null}
            </div>
          </li>
        ))}
      </ol>
    ))
    .with({ kind: 'numbered' }, b => (
      <ol className="bn-steplist">
        {b.items.map((item, i) => (
          <li key={i}>
            <span className="bn-steplist__n">{i + 1}</span>
            <p><Inline content={item} /></p>
          </li>
        ))}
      </ol>
    ))
    .with({ kind: 'outlist' }, b => <ul className="bn-outlist">{b.items.map((item, i) => <li key={i}><Inline content={item} /></li>)}</ul>)
    .with({ kind: 'headsup' }, b => (
      <Alert tone="neutral" icon="!" label={`${b.items.length} ${b.items.length === 1 ? 'thing' : 'things'} to know`}>
        <ul>{b.items.map((item, i) => <li key={i}><Inline content={item} /></li>)}</ul>
      </Alert>
    ))
    .with({ kind: 'met' }, b => (
      <ul className="bn-checklist" data-variant="met">
        {b.items.map((item, i) => (
          <li className="bn-checklist__item" data-state="done" key={i}>
            <span className="bn-checklist__box">✓</span>
            <span className="bn-checklist__text"><Inline content={item} /></span>
          </li>
        ))}
      </ul>
    ))
    .with({ kind: 'callout' }, b =>
      b.tone === 'short'
        ? <Alert tone="primary" icon="i" label="In short"><Inline content={b.content} /></Alert>
        : <Alert tone="warning" icon="!" label="Need to know"><Inline content={b.content} /></Alert>,
    )
    .with({ kind: 'none' }, b => (
      <p className="nk-none">
        <span>No impact on</span>
        {b.kinds.map(kind => <span className="bn-badge" data-variant="plain" key={kind}>{kind}</span>)}
      </p>
    ))
    .with({ kind: 'task' }, b => (
      <article className="bn-task">
        <div className="bn-task__kicker">
          <span>{b.id}</span>
          {b.area ? <span className="bn-badge">{b.area}</span> : null}
          {b.size ? <span>size {b.size}</span> : null}
        </div>
        <h3 className="bn-task__title">{b.title}</h3>
        <dl className="bn-task__rows">
          {b.rows.map(([label, value]) => [<dt key={`${label}-t`}>{label}</dt>, <dd key={`${label}-d`}><Inline content={value} /></dd>])}
        </dl>
        <div className="bn-task__foot">
          {b.depends === 'none' ? <span className="bn-badge" data-tone="success">starts first</span> : <span className="bn-badge">after {b.depends}</span>}
        </div>
      </article>
    ))
    .exhaustive()
}

export function Blocks({ blocks, context = {} }: { blocks: Block[]; context?: DocContext }) {
  return <>{blocks.map((block, i) => <BlockView block={block} context={context} key={i} />)}</>
}
