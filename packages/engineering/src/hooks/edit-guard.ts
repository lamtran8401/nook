import { relative, resolve, sep } from 'node:path'

import { block, type HookInput, type HookResult, pass } from '@nook/shared/hook.ts'

import { Home } from '../home.ts'
import { Engineering } from '../service.ts'
import { Caller, whoOf } from './caller.ts'

/**
 * PreToolUse Edit, Write: a reader never writes; a builder edits only the area of its own running slice and never the
 * documents of an item. The lead and the owner edit any file: the door of the item (submit, accept) shows what changed.
 */

export function editGuard(input: HookInput): HookResult {
  const target = editTarget(input)
  if (!target) return pass
  const caller = Caller.from(input)
  if (caller.role === 'reader')
    return block(`${caller.actor} is a reader: a reader never writes a file. Report what you found instead.`)
  const eng = Engineering.open(target.home, whoOf(caller, input.session_id))
  const inWork = workPath(target.home, target.file)
  if (inWork) return documentRule(eng, caller, inWork)
  return caller.role === 'builder' ? builderAreaRule(eng, caller, target.file) : pass
}

/**
 * PostToolUse Edit, Write: an area file that changed with no running slice of its area is logged once on each item
 * in cooking or review that holds the area, so the accept shows it. A helper: it never blocks.
 */
export function editLog(input: HookInput): HookResult {
  const target = editTarget(input)
  if (!target || workPath(target.home, target.file)) return pass
  const area = target.home.areaOf(target.file)
  if (!area) return pass
  const eng = Engineering.open(target.home, whoOf(Caller.from(input), input.session_id))
  const { slices, items, events } = eng.stores
  if (slices.running().some(s => s.itemState === 'cooking' && s.area === area.name)) return pass
  const file = relative(target.home.dir, target.file)
  const holders = items.list().filter(item => (item.state === 'cooking' || item.state === 'review') && item.areas.includes(area.name))
  eng.ledger.write(() => {
    for (const item of holders) if (!events.history(item.id).some(e => e.type === 'file' && e.reason === file)) events.record(item.id, 'file', { reason: file })
  })
  return pass
}

function editTarget(input: HookInput): { home: Home; file: string } | null {
  const cwd = input.cwd ?? process.cwd()
  const home = Home.find(cwd)
  const path = String(input.tool_input?.file_path ?? input.tool_input?.notebook_path ?? '')
  return home && path ? { home, file: resolve(cwd, path) } : null
}

/** `<id>/<name>` of a file in the item folder, or null for a file outside it. */
function workPath(home: Home, file: string): string[] | null {
  const inWork = relative(home.workRoot, file)
  return inWork && !inWork.startsWith('..') && !inWork.startsWith(sep) ? inWork.split(sep) : null
}

/** A builder edits only in the area of its own running slice, so two builders never meet in one area. */
function builderAreaRule(eng: Engineering, caller: Caller, file: string): HookResult {
  const area = eng.home.areaOf(file)
  if (!area) return pass
  const running = eng.stores.slices.running().filter(s => s.itemState === 'cooking' && s.area === area.name)
  if (running.some(s => s.assignee === caller.actor)) return pass
  const holders = running.map(s => `${s.item} ${s.id} (${s.assignee})`).join(', ') || 'no slice'
  return block(`${caller.actor}: a builder edits only in the area of its own slice; area ${area.name} runs ${holders}.`)
}

const ITEM_DOCS = /^(spec|plan|tasks|findings|handoff|root-cause)\.md$|^walkthrough\./

/** `<item folder>/<id>/<name>`: the documents of an item open in every stage; a builder never writes them. */
function documentRule(eng: Engineering, caller: Caller, parts: string[]): HookResult {
  const [id, name] = parts
  if (!id || !name || parts.length !== 2) return pass
  if (caller.role === 'builder') return block('a builder edits the files of its slice, not the documents of the item.')
  if (!eng.stores.items.find(id)) return block(`no item ${id} in the ledger: nook eng item new ${id} "<title>" first.`)
  if (ITEM_DOCS.test(name)) return pass
  return block(
    `${name} is not a document of ${id}: ${eng.home.config.dir}/${id}/ holds spec.md, plan.md, tasks.md, findings.md, root-cause.md, walkthrough.md and handoff.md.`,
  )
}
