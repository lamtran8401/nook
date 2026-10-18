import type { Criterion } from '@nook/engineering/stores/criteria.ts'

/** The acceptance criteria of an item, each with its number, its text, whether it is met and its evidence. */
export function Criteria({ criteria }: { criteria: Criterion[] }) {
  return (
    <ol className="bn-records">
      {criteria.map(c => (
        <li key={c.n}>
          <span className="bn-records__id">AC{c.n}</span>
          <div>
            <div className="bn-records__head">
              <span className="bn-badge bn-records__state" data-tone={c.done ? 'success' : 'neutral'}>{c.done ? 'met' : 'open'}</span>
            </div>
            <p>{c.text}</p>
            {c.done && c.evidence ? <p className="bn-records__sub">{c.evidence}</p> : null}
          </div>
        </li>
      ))}
    </ol>
  )
}
