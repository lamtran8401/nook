import { relative, resolve, sep } from 'node:path'

import { match, P } from 'ts-pattern'

import { block, type HookInput, type HookResult, pass } from '@kit/shared/hook.ts'

import { Home } from '../home.ts'
import { Engineering } from '../service.ts'
import { Caller, whoOf } from './caller.ts'

/** PreToolUse Edit, Write: a reader never writes; a document opens in its stage; an area, in a slice. */

export function editGuard(input: HookInput): HookResult {
  const cwd = input.cwd ?? process.cwd()
  const home = Home.find(cwd)
  if (!home) return pass
  const target = String(input.tool_input?.file_path ?? input.tool_input?.notebook_path ?? '')
  if (!target) return pass
  const caller = Caller.from(input)
  if (caller.role === 'reader')
    return block(`${caller.actor} is a reader: a reader never writes a file. Report what you found instead.`)
  const full = resolve(cwd, target)
  const eng = Engineering.open(home, whoOf(caller, input.session_id))
  const inWork = relative(home.workRoot, full)
  if (inWork && !inWork.startsWith('..') && !inWork.startsWith(sep))
    return documentRule(eng, caller, inWork.split(sep))
  return areaRule(eng, caller, full)
}

/** A file of an area changes only while a slice of the area runs in cooking; for a builder, its own slice. */
function areaRule(eng: Engineering, caller: Caller, file: string): HookResult {
  const area = eng.home.areaOf(file)
  if (!area) return pass
  const running = eng.stores.slices.running().filter(s => s.itemState === 'cooking' && s.area === area.name)
  if (!running.length) {
    return block(
      `area ${area.name} has no item in cooking with a running slice: a file of an area changes inside a slice (kit eng task start <id> <T>).`,
    )
  }
  if (caller.role !== 'builder' || running.some(s => s.assignee === caller.actor)) return pass
  const holders = running.map(s => `${s.item} ${s.id} (${s.assignee})`).join(', ')
  return block(
    `${caller.actor}: a builder edits only in the area of its own slice; area ${area.name} runs ${holders}.`,
  )
}

type DocumentKind = 'spec' | 'plan' | 'free' | 'other'

const kindOf = (name: string): DocumentKind =>
  match(name)
    .with('spec.md', () => 'spec' as const)
    .with('plan.md', 'tasks.md', () => 'plan' as const)
    .with('findings.md', 'handoff.md', P.string.startsWith('walkthrough.'), () => 'free' as const)
    .otherwise(() => 'other' as const)

/** `work/<id>/<name>`: spec.md opens in framing, plan.md and tasks.md in planning. */
function documentRule(eng: Engineering, caller: Caller, parts: string[]): HookResult {
  const [id, name] = parts
  if (!id || !name || parts.length !== 2) return pass
  if (caller.role === 'builder')
    return block('a builder edits the files of its slice, not the documents of the item.')
  const item = eng.stores.items.find(id)
  if (!item) return block(`no item ${id} in the ledger: kit eng item new ${id} "<title>" first.`)
  return match(kindOf(name))
    .with('spec', () =>
      item.state === 'framing'
        ? pass
        : block(
            `${id} is ${item.state}: spec.md opens only in framing (kit eng item reframe ${id} --reason "<why>").`,
          ),
    )
    .with('plan', () =>
      item.state === 'planning'
        ? pass
        : block(
            `${id} is ${item.state}: ${name} opens only in planning (kit eng item replan ${id} --reason "<why>").`,
          ),
    )
    .with('free', () => pass)
    .with('other', () =>
      block(
        `${name} is not a document of ${id}: work/${id}/ holds spec.md, plan.md, tasks.md, findings.md, walkthrough.md and handoff.md.`,
      ),
    )
    .exhaustive()
}
