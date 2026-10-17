import { existsSync } from 'node:fs'

import type { Finding } from '@nook/env/env.ts'

import { cut } from '../format.ts'
import { FingerprintsUnchanged } from '../guards/fingerprints.ts'
import { GuardContext } from '../guards/guard.ts'
import type { Engineering } from '../service.ts'
import type { Item } from '../stores/items.ts'

/** `doctor`: the gaps of the pack in this home, each with its fix. */

export type { Finding } from '@nook/env/env.ts'

const DAY_MS = 24 * 60 * 60 * 1000
const drift = new FingerprintsUnchanged()

export function doctor(eng: Engineering): Finding[] {
  const found = [
    ...configFindings(eng),
    ...eng.stores.items.open().flatMap(item => itemFindings(eng, item)),
    ...sharedAreas(eng),
  ]
  if (found.length) return found
  return [
    {
      level: 'ok',
      where: eng.home.dir,
      text: `${eng.stores.items.open().length} open items, ${eng.home.config.areas.length} areas, no gap`,
    },
  ]
}

function configFindings(eng: Engineering): Finding[] {
  const home = eng.home.dir
  const config = eng.home.config
  const found: Finding[] = []
  if (config.missing)
    found.push({
      level: 'warn',
      where: home,
      text: 'nook.yml has no engineering section: no areas, so verify cannot run',
      fix: 'add areas to nook.yml with /setup',
    })
  for (const area of config.areas) {
    if (!existsSync(eng.home.areaDir(area)))
      found.push({
        level: 'error',
        where: area.name,
        text: `the folder of area ${area.name} does not exist: ${area.path}`,
        fix: 'fix path: in nook.yml',
      })
    if (!area.checks)
      found.push({
        level: 'warn',
        where: area.name,
        text: `area ${area.name} has no checks: verify fails until set`,
        fix: 'add checks: [<command>] to the area in nook.yml, or checks: [] for none',
      })
  }
  for (const folder of [config.dir, config.backlog, 'docs/adr']) {
    if (!existsSync(`${home}/${folder}`))
      found.push({ level: 'warn', where: home, text: `${folder}/ is missing`, fix: 'nook init --update' })
  }
  return found
}

function itemFindings(eng: Engineering, item: Item): Finding[] {
  const id = item.id
  const found: Finding[] = []
  for (const name of item.areas.filter(a => !eng.home.config.area(a))) {
    found.push({
      level: 'error',
      where: id,
      text: `${id} names an area that nook.yml does not have: ${name}`,
      fix: `nook eng item edit ${id} areas <a,b>, or add the area with /setup`,
    })
  }
  if (['ready', 'cooking', 'review'].includes(item.state)) {
    for (const doc of drift.changed(new GuardContext(eng.home, eng.stores, item))) {
      found.push({
        level: 'warn',
        where: id,
        text: `${id}: ${doc} changed after the approve`,
        fix: `nook eng item replan ${id}`,
      })
    }
  }
  const live = eng.stores.slices.live(id)
  if (item.state === 'cooking' && item.kind !== 'investigate' && !live.length) {
    found.push({
      level: 'warn',
      where: id,
      text: `${id} is cooking with no slice`,
      fix: `nook eng item replan ${id} --reason "no slices", then write tasks.md`,
    })
  }
  for (const s of live.filter(s => s.state === 'waiting' || s.state === 'failed')) {
    const fix =
      s.state === 'failed' ? `nook eng task retry ${id} ${s.id}` : `nook eng task resume ${id} ${s.id}`
    found.push({
      level: 'warn',
      where: id,
      text: `${id} ${s.id} is ${s.state}${s.reason ? `: ${cut(s.reason, 80)}` : ''}`,
      fix,
    })
  }
  for (const q of eng.stores.questions
    .openBlocking(id)
    .filter(q => Date.now() - Date.parse(q.asked_at) > DAY_MS)) {
    found.push({
      level: 'warn',
      where: id,
      text: `${id} ${q.id} has blocked for more than a day: ${cut(q.text, 80)}`,
      fix: `nook eng answer ${id} ${q.id} "<answer>"`,
    })
  }
  return found
}

/** v0.1 lets one item cook in an area at a time. */
function sharedAreas(eng: Engineering): Finding[] {
  const inUse = new Map<string, string[]>()
  for (const item of eng.stores.items.open().filter(i => i.state === 'cooking')) {
    for (const name of item.areas) inUse.set(name, [...(inUse.get(name) ?? []), item.id])
  }
  return [...inUse]
    .filter(([, ids]) => ids.length > 1)
    .map(([area, ids]) => ({
      level: 'error',
      where: area,
      text: `two items cook in area ${area}: ${ids.join(', ')}`,
      fix: 'finish one, or move it to another area',
    }))
}
