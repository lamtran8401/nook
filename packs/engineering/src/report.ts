import { existsSync, readFileSync } from 'node:fs'

import { write } from './db.ts'
import { currentBranch, dirtyFiles, isRepo } from './git.ts'
import { areaDir } from './home.ts'
import type { Kit } from './kit.ts'
import { criteria } from './model/criteria.ts'
import { approvedHashes, docPath, DOCS, type Gap, gaps, hashOf, readDoc } from './model/guards.ts'
import { getItem, type Item, lastEvent, listItems, openItems, recordSession } from './model/items.ts'
import { guesses } from './model/guesses.ts'
import { openBlocking, questions } from './model/questions.ts'
import { liveSlices, readySlices, slices } from './model/slices.ts'
import { assertCan } from './role.ts'

/** What to do now, the brief of an item, the lines for `kit brief` and `kit doctor`. */

export type Next = { id: string; state: string; skill: string; owner: boolean; gaps: Gap[]; detail: string }

const DAY_MS = 24 * 60 * 60 * 1000

/** The next step of one item: the skill to type, or the owner's command. */
export function nextFor(kit: Kit, item: Item): Next {
  const id = item.id
  const base = { id, state: item.state, owner: false, gaps: [] as Gap[], detail: '' }
  const blocking = openBlocking(kit, id)
  if (blocking.length) return { ...base, skill: `answer ${blocking.map(q => q.id).join(', ')}: kit eng answer ${id} ${blocking[0]!.id} "<answer>"`, owner: true, detail: blocking.map(q => `${q.id} ${q.text}`).join('; ') }
  switch (item.state) {
    case 'backlog': return { ...base, skill: `/spec ${id}` }
    case 'framing': return { ...base, skill: `/spec ${id}`, detail: 'continue the spec' }
    case 'planning': {
      const found = gaps(kit, item, 'approve')
      if (!found.length) return { ...base, skill: `owner: kit eng item approve ${id}`, owner: true }
      return { ...base, skill: `/recipe ${id}`, gaps: found, detail: `${found.length} gap${found.length > 1 ? 's' : ''} before the approve` }
    }
    case 'ready': return { ...base, skill: `/cook ${id}`, gaps: gaps(kit, item, 'begin') }
    case 'cooking': {
      const live = liveSlices(kit, id)
      const running = live.filter(s => s.state === 'running').length
      const ready = readySlices(kit, id).length
      return { ...base, skill: `/cook ${id}`, gaps: gaps(kit, item, 'submit'), detail: `${live.filter(s => s.state === 'done').length}/${live.length} slices done, ${running} running, ${ready} ready` }
    }
    case 'checking': {
      const found = gaps(kit, item, 'accept')
      if (!found.length) return { ...base, skill: `owner: kit eng item accept ${id}`, owner: true }
      return { ...base, skill: `/check ${id}`, gaps: found, detail: `${found.length} gap${found.length > 1 ? 's' : ''} before the accept` }
    }
    case 'done': return lastEvent(kit, id, 'archive') ? { ...base, skill: 'closed' } : { ...base, skill: `/close ${id}` }
    case 'blocked': return { ...base, skill: `kit eng item unblock ${id} when it is resolved`, detail: item.reason ?? '' }
    default: return { ...base, skill: item.state }
  }
}

const ORDER: Record<string, number> = { checking: 0, cooking: 1, ready: 2, planning: 3, framing: 4, backlog: 5, blocked: 6, done: 7 }

/** `next [<id>]`: the lines, the owner's first. */
export function next(kit: Kit, id?: string): Next[] {
  const items = id ? [getItem(kit, id)] : [...openItems(kit), ...listItems(kit, 'done').filter(i => !lastEvent(kit, i.id, 'archive'))]
  const lines = items.map(item => nextFor(kit, item))
  return lines.sort((a, b) => Number(b.owner) - Number(a.owner) || (ORDER[a.state] ?? 9) - (ORDER[b.state] ?? 9))
}

export function formatNext(lines: Next[]): string {
  const waiting = lines.filter(l => l.owner)
  const head = waiting.length ? `Waits for you: ${waiting.map(l => `${l.id}: ${l.skill.replace(/^owner: /, '')}`).join('; ')}` : 'Nothing waits for you.'
  const rest = lines.map(l => `${l.id.padEnd(10)} ${l.state.padEnd(9)} ${l.skill}${l.detail ? `  (${l.detail})` : ''}`)
  return [head, ...rest].join('\n')
}

const cut = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1)}…` : text)

/** The brief of an item for an agent: at most about 1800 characters. */
export function itemBrief(kit: Kit, id: string, limit = 1800): string {
  const item = getItem(kit, id)
  const step = nextFor(kit, item)
  const head = [
    `${item.id} — ${cut(item.title, 80)} [${item.kind} ${item.size}${item.quick ? ', quick' : ''}]  state: ${item.state}  mode: ${item.mode}`,
    `next: ${step.skill}${step.detail ? ` (${step.detail})` : ''}`,
    `areas: ${item.areas.map(name => {
      const area = kit.home.config.areas.find(a => a.name === name)
      return area ? `${name} → ${area.path} (${area.kind})` : `${name} (not in kit.yml)`
    }).join('; ') || 'none'}`,
  ]
  const lists = [
    ['ACs', criteria(kit, id).map(c => `${c.done ? '[x]' : '[ ]'} ${c.n} ${cut(c.text, 90)}${c.done ? ` (${c.grade})` : ''}`)],
    ['slices', slices(kit, id).filter(s => s.state !== 'cancelled').map(s => `${s.id} ${s.state} ${s.area} "${cut(s.title, 50)}"${s.acs.length ? ` acs ${s.acs.join(',')}` : ''}${s.depends.length ? ` after ${s.depends.join(',')}` : ''}${s.assignee ? ` by ${s.assignee}` : ''}`)],
    ['open questions', questions(kit, id, true).map(q => `${q.id}${q.blocking ? ' (blocking)' : ''} ${cut(q.text, 90)}${q.recommended ? ` → rec: ${cut(q.recommended, 40)}` : ''}`)],
    ['open guesses', guesses(kit, id, true).map(g => `${g.id} (${g.impact}) ${cut(g.question, 60)} → took ${cut(g.took, 40)}${g.slices.length ? ` [${g.slices.join(',')}]` : ''}`)],
    ['gaps', step.gaps.map(g => `${cut(g.text, 90)} → ${cut(g.fix, 60)}`)],
  ] as const
  let text = head.join('\n')
  const live = lists.filter(([, entries]) => entries.length)
  // each list gets an equal share of what is left, so a long list of slices never hides the questions
  live.forEach(([name, entries], i) => {
    const budget = Math.floor((limit - text.length) / (live.length - i))
    let shown = entries.length
    let block = ''
    do {
      const more = entries.length - shown
      block = `\n${name}:\n${entries.slice(0, shown).map(e => `  ${e}`).join('\n')}${more > 0 ? `\n  … and ${more} more` : ''}`
      shown--
    } while (block.length > budget && shown > 0)
    if (block.length <= budget) text += block
  })
  return text
}

/** The brief of a slice for a builder: what to build, where, and the commands to run. */
export function taskBrief(kit: Kit, id: string, sliceId: string): string {
  const item = getItem(kit, id)
  const slice = slices(kit, id).find(s => s.id === sliceId.toUpperCase())
  if (!slice) return `${id} has no slice ${sliceId}`
  const area = kit.home.config.areas.find(a => a.name === slice.area)
  const acs = criteria(kit, id).filter(c => slice.acs.includes(c.n))
  const lines = [
    `${item.id} ${slice.id}: ${slice.title}  [${slice.state}${slice.assignee ? `, ${slice.assignee}` : ''}]`,
    `item: ${cut(item.title, 80)} (${item.kind} ${item.size}, ${item.state})`,
    `area: ${slice.area} → ${area ? `${areaDir(kit.home, area)} (${area.kind})` : 'not in kit.yml'}${area?.test ? `; test: ${area.test}` : ''}${area?.checks?.length ? `; checks: ${area.checks.join(' && ')}` : ''}`,
    slice.depends.length ? `after: ${slice.depends.join(', ')}` : '',
    acs.length ? `criteria:\n${acs.map(c => `  ${c.n} ${c.text}`).join('\n')}` : 'criteria: none named',
    slice.files.length ? `files so far: ${slice.files.join(', ')}` : '',
    `proof: ${slice.proof}${slice.proof_note ? ` (${cut(slice.proof_note, 100)})` : ''}`,
    `run: kit eng task start ${id} ${slice.id}; write the failing test first; kit eng task prove ${id} ${slice.id} --files <tests>; kit eng task done ${id} ${slice.id} --files <all files>, or task wait --reason "<what you need>"; after three failed tries: task fail --reason`,
    `record a guess: kit eng guess ${id} "<question>" --took <a> --other <b> --impact low|med|high --slices ${slice.id}`,
  ]
  return lines.filter(Boolean).join('\n')
}

/** `pickup <id>`: this session leads the item; the brief and the last handoff. */
export function pickup(kit: Kit, id: string): string {
  assertCan(kit.who, 'pickup')
  getItem(kit, id)
  write(kit.db, () => recordSession(kit, id))
  const handoff = docPath(kit, id, 'handoff.md')
  const parts = [itemBrief(kit, id)]
  if (existsSync(handoff)) parts.push(`--- handoff.md ---\n${readFileSync(handoff, 'utf8').trim()}`)
  return parts.join('\n')
}

export type BriefLine = { pack: 'engineering'; text: string; urgency: 'now' | 'today' | 'info'; action: string; ref: string }

export function brief(kit: Kit): BriefLine[] {
  const lines: BriefLine[] = []
  const line = (urgency: BriefLine['urgency'], ref: string, text: string, action: string) => lines.push({ pack: 'engineering', text, urgency, action, ref })
  for (const item of openItems(kit)) {
    const step = nextFor(kit, item)
    if (step.owner && !openBlocking(kit, item.id).length) line('now', item.id, `${item.id} waits for your ${item.state === 'planning' ? 'approve' : 'accept'}: ${cut(item.title, 60)}`, step.skill.replace(/^owner: /, ''))
    for (const q of openBlocking(kit, item.id)) line('now', item.id, `${item.id} ${q.id} blocks: ${cut(q.text, 80)}`, `kit eng answer ${item.id} ${q.id} "<answer>"`)
    for (const s of liveSlices(kit, item.id).filter(s => s.state === 'failed')) line('today', item.id, `${item.id} ${s.id} failed: ${cut(s.reason ?? '', 80)}`, `kit eng task retry ${item.id} ${s.id}, or /cook ${item.id}`)
    if (item.state === 'cooking' && Date.now() - Date.parse(item.updated) > DAY_MS) line('today', item.id, `${item.id} is cooking with no activity for a day`, `/pickup ${item.id}`)
  }
  return lines
}

export type Finding = { level: 'error' | 'warn' | 'ok'; where: string; text: string; fix?: string }

export function doctor(kit: Kit): Finding[] {
  const found: Finding[] = []
  const home = kit.home.dir
  const config = kit.home.config
  if (config.missing) found.push({ level: 'warn', where: home, text: 'kit.yml has no engineering section: no areas, so verify cannot run', fix: 'add areas to kit.yml with /setup' })
  for (const area of config.areas) {
    if (!existsSync(areaDir(kit.home, area))) found.push({ level: 'error', where: area.name, text: `the folder of area ${area.name} does not exist: ${area.path}`, fix: 'fix path: in kit.yml' })
    if (!area.checks) found.push({ level: 'warn', where: area.name, text: `area ${area.name} has no checks: verify fails until set`, fix: 'add checks: [<command>] to the area in kit.yml, or checks: [] for none' })
  }
  for (const folder of [config.dir, config.backlog, 'docs/adr']) {
    if (!existsSync(`${home}/${folder}`)) found.push({ level: 'warn', where: home, text: `${folder}/ is missing`, fix: 'kit eng init' })
  }
  const known = new Set(config.areas.map(a => a.name))
  const inUse = new Map<string, string[]>()
  for (const item of openItems(kit)) {
    for (const name of item.areas) {
      if (!known.has(name)) found.push({ level: 'error', where: item.id, text: `${item.id} names an area that kit.yml does not have: ${name}`, fix: `kit eng item edit ${item.id} areas <a,b>, or add the area with /setup` })
      if (item.state === 'cooking') inUse.set(name, [...(inUse.get(name) ?? []), item.id])
    }
    if (['ready', 'cooking', 'checking'].includes(item.state) && !item.quick) {
      const approved = approvedHashes(kit, item.id)
      for (const doc of DOCS) if (approved.has(doc) && approved.get(doc) !== hashOf(readDoc(kit, item.id, doc))) found.push({ level: 'warn', where: item.id, text: `${item.id}: ${doc} changed after the approve`, fix: `kit eng item replan ${item.id}` })
    }
    const live = liveSlices(kit, item.id)
    if (item.state === 'cooking' && item.kind !== 'investigate' && !live.length) found.push({ level: 'warn', where: item.id, text: `${item.id} is cooking with no slice`, fix: `kit eng item replan ${item.id} --reason "no slices", then write tasks.md` })
    for (const s of live.filter(s => s.state === 'waiting' || s.state === 'failed')) found.push({ level: 'warn', where: item.id, text: `${item.id} ${s.id} is ${s.state}${s.reason ? `: ${cut(s.reason, 80)}` : ''}`, fix: s.state === 'failed' ? `kit eng task retry ${item.id} ${s.id}` : `kit eng task resume ${item.id} ${s.id}` })
    for (const q of openBlocking(kit, item.id)) {
      if (Date.now() - Date.parse(q.asked_at) > DAY_MS) found.push({ level: 'warn', where: item.id, text: `${item.id} ${q.id} has blocked for more than a day: ${cut(q.text, 80)}`, fix: `kit eng answer ${item.id} ${q.id} "<answer>"` })
    }
  }
  for (const [area, ids] of inUse) if (ids.length > 1) found.push({ level: 'error', where: area, text: `two items cook in area ${area}: ${ids.join(', ')}`, fix: 'finish one, or move it to another area' })
  if (!found.length) found.push({ level: 'ok', where: home, text: `${openItems(kit).length} open items, ${config.areas.length} areas, no gap` })
  return found
}

export const formatFindings = (found: Finding[]) =>
  found.map(f => `${f.level === 'ok' ? '✓' : f.level === 'error' ? '✗' : '!'} ${f.text}${f.fix ? `\n    fix: ${f.fix}` : ''}`).join('\n')

export type AreaStatus = { area: string; path: string; kind: string; exists: boolean; branch: string | null; dirty: number; item: string | null }

export function areaStatus(kit: Kit): AreaStatus[] {
  const cooking = listItems(kit, 'cooking')
  return kit.home.config.areas.map(area => {
    const dir = areaDir(kit.home, area)
    const repo = area.git && isRepo(dir)
    return { area: area.name, path: area.path, kind: area.kind, exists: existsSync(dir), branch: repo ? currentBranch(dir) : null, dirty: repo ? dirtyFiles(dir).length : 0, item: cooking.find(i => i.areas.includes(area.name))?.id ?? null }
  })
}
