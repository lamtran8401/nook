import { match } from 'ts-pattern'

import { sameAsSpec, type Slice } from '../stores/slices.ts'
import type { Gap, Guard, GuardContext } from './guard.ts'

/** The guards on the slices. None of them applies to a flow with no slices. */

const noSlices = (ctx: GuardContext) => ctx.flow.slices === 'none'

const fixWith = (ctx: GuardContext, change: string) =>
  `${change} in ${ctx.folder.path('tasks.md')}, then nook eng task import ${ctx.id}`

/** approve: tasks.md parses, has a slice, and the ledger holds the same slices. */
export class SlicesImported implements Guard {
  check(ctx: GuardContext): Gap[] {
    if (noSlices(ctx)) return []
    const tasks = ctx.tasks()
    const file = ctx.folder.path('tasks.md')
    if (!tasks)
      return [{ text: 'tasks.md is missing', fix: `write ${file}, then nook eng task import ${ctx.id}` }]
    if (tasks.problems.length)
      return tasks.problems.map(p => ({ text: `tasks.md: ${p}`, fix: fixWith(ctx, 'fix the line') }))
    const found: Gap[] = []
    if (!tasks.slices.length) {
      found.push({
        text: 'tasks.md has no slice',
        fix: fixWith(ctx, 'write `## T1: title` with area, depends, acs, size, done when'),
      })
    }
    const live = ctx.stores.slices.live(ctx.id)
    const differ = tasks.slices
      .filter(spec => !live.some(s => s.id === spec.id && sameAsSpec(s, spec)))
      .map(s => s.id)
    const extra = live.filter(s => !tasks.slices.some(spec => spec.id === s.id)).map(s => s.id)
    if (differ.length || extra.length) {
      found.push({
        text: `tasks.md and the ledger differ: ${[...differ, ...extra].join(', ')}`,
        fix: `nook eng task import ${ctx.id}`,
      })
    }
    return found
  }
}

export class EveryAcInSlice implements Guard {
  check(ctx: GuardContext): Gap[] {
    const tasks = ctx.cleanTasks()
    if (noSlices(ctx) || !tasks) return []
    const criteria = ctx.stores.criteria.list(ctx.id)
    const missing = criteria
      .filter(c => !tasks.slices.some(s => s.acs.includes(c.n)))
      .map(c => ({
        text: `AC ${c.n} is in no slice: ${c.text}`,
        fix: fixWith(ctx, `add ${c.n} to the acs: line of a slice`),
      }))
    // a reframe can renumber the criteria and leave a slice on a number that is gone
    const known = new Set(criteria.map(c => c.n))
    const stale = tasks.slices.flatMap(s =>
      s.acs
        .filter(n => !known.has(n))
        .map(n => ({
          text: `${s.id} names AC ${n}, but the spec has ${criteria.length} criteria`,
          fix: fixWith(ctx, `fix the acs: line of ${s.id}`),
        })),
    )
    return [...missing, ...stale]
  }
}

export class SliceAreasOfItem implements Guard {
  check(ctx: GuardContext): Gap[] {
    const tasks = ctx.cleanTasks()
    if (noSlices(ctx) || !tasks) return []
    const areas = ctx.item.areas
    return tasks.slices
      .filter(s => !areas.includes(s.area))
      .map(s => ({
        text: `${s.id}: area ${s.area} is not an area of ${ctx.id} (${areas.join(', ') || 'none'})`,
        fix: `fix area: in ${ctx.folder.path('tasks.md')}, or add the area to the spec front matter and reframe`,
      }))
  }
}

export class NoDependsCycle implements Guard {
  check(ctx: GuardContext): Gap[] {
    const cycle = noSlices(ctx) ? null : ctx.cleanTasks()?.cycle()
    if (!cycle) return []
    return [{ text: `depends has a cycle: ${cycle.join(' → ')}`, fix: fixWith(ctx, 'break it') }]
  }
}

/** submit: at least one slice is done, and every other live slice is done too. */
export class SlicesDone implements Guard {
  check(ctx: GuardContext): Gap[] {
    if (noSlices(ctx)) return []
    const live = ctx.stores.slices.live(ctx.id)
    const found: Gap[] = []
    if (!live.some(s => s.state === 'done'))
      found.push({ text: 'no slice is done', fix: `nook eng task done ${ctx.id} <T> --files <f...>` })
    for (const s of live.filter(s => s.state !== 'done'))
      found.push({ text: `${s.id} is ${s.state}`, fix: sliceFix(ctx.id, s) })
    return found
  }
}

function sliceFix(id: string, s: Slice): string {
  return match(s.state)
    .with(
      'failed',
      () => `nook eng task retry ${id} ${s.id}, or nook eng task cancel ${id} ${s.id} --reason "<why>"`,
    )
    .with('waiting', () => `answer what it waits for, then nook eng task resume ${id} ${s.id}`)
    .with('todo', 'running', 'done', 'cancelled', () => `nook eng task done ${id} ${s.id} --files <f...>`)
    .exhaustive()
}
