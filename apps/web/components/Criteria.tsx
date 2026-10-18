import type { Criterion } from '@nook/engineering/stores/criteria.ts'

import { CRITERION_TONE, criterionTag } from './tones.ts'

function Row({ criterion }: { criterion: Criterion }) {
  const { tag, words } = criterionTag(criterion.text)
  return (
    <li>
      <span className="bn-records__id">AC{criterion.n}</span>
      <div>
        <div className="bn-records__head">
          {tag ? <span className="bn-badge" data-tone={CRITERION_TONE[tag]}>{tag}</span> : null}
          <span className="bn-badge bn-records__state" data-tone={criterion.done ? 'success' : 'neutral'}>{criterion.done ? 'met' : 'open'}</span>
        </div>
        <p>{words}</p>
        {criterion.done && criterion.evidence ? <p className="bn-records__sub">{criterion.evidence}</p> : null}
      </div>
    </li>
  )
}

/** The acceptance criteria of an item, each with its number, its tag, its text, whether it is met and its evidence. */
export function Criteria({ criteria }: { criteria: Criterion[] }) {
  return (
    <ol className="bn-records">
      {criteria.map(c => (
        <Row criterion={c} key={c.n} />
      ))}
    </ol>
  )
}
