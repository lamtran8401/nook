import { existsSync } from 'node:fs'

import { refused } from '@kit/shared/errors.ts'

import { now, write } from '../db.ts'
import { type Area, areaDir, areaNamed } from '../home.ts'
import type { Kit } from '../kit.ts'
import { assertCan } from '../role.ts'
import { getItem, type Item, recordEvent } from './items.ts'

/** `item verify`: the checks of each area of the item, one `check_run` row for each check. */

export type CheckRun = { id: number; item: string; area: string; check: string; result: 'pass' | 'fail'; output: string; at: string }

const OUTPUT_KEEP = 4000
const CHECK_LIMIT_MS = 10 * 60 * 1000

export function verify(kit: Kit, id: string, only?: string): CheckRun[] {
  assertCan(kit.who, 'item verify')
  const item = getItem(kit, id)
  if (kit.home.config.missing || !kit.home.config.areas.length) throw refused('kit.yml has no areas, so there is nothing to check', 'add areas to kit.yml with /setup')
  const names = only ? [only] : item.areas
  if (!names.length) throw refused(`${id} has no areas`, `kit eng item edit ${id} areas <a,b>`)
  const areas = names.map(name => areaNamed(kit.home, name))
  for (const area of areas) {
    if (!area.checks) throw refused(`area ${area.name} has no \`checks\` in kit.yml`, `add checks: [<command>] to the area, or checks: [] for none`)
    if (!existsSync(areaDir(kit.home, area))) throw refused(`the folder of area ${area.name} does not exist: ${areaDir(kit.home, area)}`, 'fix the path in kit.yml')
  }
  // the checks run first, with no lock held; one short write records them
  const at = now()
  const results = areas.flatMap(area => (area.checks ?? []).map(check => runCheck(kit, area, check)))
  write(kit.db, () => {
    for (const r of results) kit.db.run('INSERT INTO check_run (item, area, "check", result, output, at) VALUES (?, ?, ?, ?, ?, ?)', [id, r.area, r.check, r.result, r.output, at])
    recordEvent(kit, id, 'verify', { reason: `${results.filter(r => r.result === 'pass').length}/${results.length} checks passed` })
  })
  return lastRun(kit, item)
}

function runCheck(kit: Kit, area: Area, check: string): Pick<CheckRun, 'area' | 'check' | 'result' | 'output'> {
  const run = Bun.spawnSync(['sh', '-c', check], { cwd: areaDir(kit.home, area), env: { ...process.env, CI: 'true' }, timeout: CHECK_LIMIT_MS, stdout: 'pipe', stderr: 'pipe' })
  const output = `${run.stdout.toString()}${run.stderr.toString()}`
  return { area: area.name, check, result: run.exitCode === 0 ? 'pass' : 'fail', output: output.slice(-OUTPUT_KEEP) }
}

/** The rows of the last run after the evidence watermark of the item: the rows that share the last `at`. */
export function lastRun(kit: Kit, item: Item): CheckRun[] {
  const last = kit.db.query('SELECT at FROM check_run WHERE item = ? AND id > ? ORDER BY id DESC LIMIT 1').get(item.id, item.evidence_from) as { at: string } | null
  if (!last) return []
  return kit.db.query('SELECT * FROM check_run WHERE item = ? AND at = ? ORDER BY id').all(item.id, last.at) as CheckRun[]
}

/** The time of the last run after the watermark when every check passed, else null. */
export function verifiedAt(kit: Kit, item: Item): string | null {
  const run = lastRun(kit, item)
  return run.length && run.every(r => r.result === 'pass') ? run[0]!.at : null
}

/** Inside a write transaction: the id of the newest check run of every item, the watermark of a move back. */
export const lastCheckId = (kit: Kit) => (kit.db.query('SELECT COALESCE(MAX(id), 0) AS id FROM check_run').get() as { id: number }).id

export const formatRun = (run: CheckRun[]) =>
  run.length ? run.map(r => `${r.result === 'pass' ? '✓' : '✗'} ${r.area}: ${r.check}${r.result === 'fail' ? `\n${r.output.trim().split('\n').slice(-8).map(l => `    ${l}`).join('\n')}` : ''}`).join('\n') : 'no run yet'
