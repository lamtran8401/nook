import type { AreaChange } from '@nook/engineering/read/reader.ts'
import type { CheckRun } from '@nook/engineering/stores/checks.ts'

import { clock } from '../../lib/time.ts'

function Checks({ runs }: { runs: CheckRun[] }) {
  if (!runs.length) return <span className="bn-changes__checks"><small>no check yet</small></span>
  const failed = runs.filter(r => r.result === 'fail').length
  const passed = runs.length - failed
  return (
    <span className="bn-changes__checks">
      {failed ? <span className="bn-badge" data-tone="danger">{failed} failing</span> : null}
      {passed ? <span className="bn-badge" data-tone="success">{passed} pass</span> : null}
      <small>{clock(runs.map(r => r.at).sort().at(-1)!)}</small>
    </span>
  )
}

/** The branch of each area of the item, its changed files and lines against the main branch, and its last checks. */
export function Branches({ changes, checks }: { changes: AreaChange[]; checks: CheckRun[] }) {
  if (!changes.length) return <p className="nk-empty">No branch yet. The build makes one for each area.</p>
  return (
    <ul className="bn-card bn-changes">
      {changes.map(change => {
        const add = change.files.reduce((n, f) => n + f.add, 0)
        const del = change.files.reduce((n, f) => n + f.del, 0)
        return (
          <li key={change.area}>
            <span className="bn-badge">{change.area}</span>
            <code className="bn-inline-code">{change.branch}</code>
            <span className="bn-changes__diff">
              <b>{change.files.length}</b> files {add ? <span className="bn-changes__add">+{add}</span> : null} {del ? <span className="bn-changes__del">−{del}</span> : null}
            </span>
            <Checks runs={checks.filter(c => c.area === change.area)} />
          </li>
        )
      })}
    </ul>
  )
}
