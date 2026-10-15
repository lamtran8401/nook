import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

import { arg, type Command, type Context, list, type Program, run, text } from '@kit/shared/cli.ts'
import { Exit, usage } from '@kit/shared/errors.ts'
import { readInput, runHook } from '@kit/shared/hook.ts'

import { branchItem, commitItem, commitPlan, prove } from './git.ts'
import { adrDir, requireHome } from './home.ts'
import { bashGuard, editGuard, sessionStart, stopHook, subagentStop, teammateIdle } from './hooks.ts'
import { type Kit, openKit } from './kit.ts'
import { adrs, newAdr, setAdrStatus } from './model/adr.ts'
import { formatRun, lastRun, verify } from './model/checks.ts'
import { addCriterion, criteria, markCriterion, unmarkCriterion } from './model/criteria.ts'
import { FORWARD, formatGaps, gaps } from './model/guards.ts'
import { addNote, archiveItem, editItem, getItem, history, type Item, listItems, newItem, notes, setMode } from './model/items.ts'
import { addGuess, decideGuess, guesses } from './model/guesses.ts'
import { MOVE_NAMES, moveItem, quickItem } from './model/moves.ts'
import { answer, ask, questions } from './model/questions.ts'
import { getSlice, importTasks, moveSlice, readySlices, type Slice, slices, TASK_MOVES } from './model/slices.ts'
import { areaStatus, brief, doctor, formatFindings, formatNext, itemBrief, next, pickup, taskBrief } from './report.ts'

const kit = (): Kit => openKit(process.cwd())
const ifVersion = (c: Context) => text(c, 'if-version')
const VERSION_FLAG = { 'if-version': { type: 'string', help: 'fail with exit 4 when the record moved past this version' } } as const

const itemLine = (i: Item) => `${i.id.padEnd(10)} ${i.state.padEnd(9)} ${i.kind} ${i.size}  ${i.title}${i.areas.length ? `  [${i.areas.join(', ')}]` : ''}${i.mode === 'auto' ? '  (auto)' : ''}`
const sliceLine = (s: Slice) => `${s.id.padEnd(4)} ${s.state.padEnd(9)} ${s.area.padEnd(10)} ${s.title}${s.acs.length ? `  acs ${s.acs.join(',')}` : ''}${s.depends.length ? `  after ${s.depends.join(',')}` : ''}${s.assignee ? `  by ${s.assignee}` : ''}  proof ${s.proof}`

const moveCommands: Command[] = MOVE_NAMES.map(name => ({
  path: ['item', name],
  summary: `move an item: ${name}`,
  usage: '<id> [--reason r] [--if-version n]',
  flags: { reason: { type: 'string', help: 'why (needed by the moves back, block and cancel)' }, ...VERSION_FLAG },
  run(c) {
    const k = kit()
    const result = moveItem(k, name, arg(c, 0, 'item id'), { reason: text(c, 'reason'), ifVersion: ifVersion(c) })
    for (const w of result.warnings) c.say(`warning: ${w}`)
    for (const n of result.notes) c.say(n)
    c.out(result.item, i => `${i.id} is ${i.state}\n${formatNext(next(k, i.id)).split('\n').slice(1).join('\n')}`)
  },
}))

const taskMoveCommands: Command[] = Object.keys(TASK_MOVES).map(name => ({
  path: ['task', name],
  summary: `move a slice: ${name}`,
  usage: '<id> <T> [--reason r] [--files f...] [--if-version n]',
  flags: { reason: { type: 'string', help: 'why' }, files: { type: 'string', list: true, help: 'the files of the slice; repeat or join with a comma' }, ...VERSION_FLAG },
  run(c) {
    const slice = moveSlice(kit(), name, arg(c, 0, 'item id'), arg(c, 1, 'slice id'), { reason: text(c, 'reason'), files: list(c, 'files'), ifVersion: ifVersion(c) })
    c.out(slice, sliceLine)
  },
}))

const program: Program = {
  name: 'kit eng',
  summary: 'the engineering pack of Harness Kit: items, slices, gates and proofs',
  commands: [
    {
      path: ['item', 'new'],
      summary: 'make an item in the backlog',
      usage: '<id> <title...> [--kind k --size s --area a... --source s --backlog]',
      flags: { kind: { type: 'string', help: 'feature | fix | chore | investigate' }, size: { type: 'string', help: 'S | M | L' }, area: { type: 'string', list: true, help: 'an area of kit.yml; repeat it' }, source: { type: 'string', help: 'where the item comes from' }, backlog: { type: 'boolean', help: 'also make backlog/<id>/ticket.md' } },
      run(c) {
        const id = arg(c, 0, 'item id')
        const title = c.args.slice(1).join(' ')
        if (!title) throw usage('give the title')
        c.out(newItem(kit(), { id, title, kind: text(c, 'kind'), size: text(c, 'size')?.toUpperCase(), areas: list(c, 'area'), source: text(c, 'source'), backlog: c.flags.backlog === true }), itemLine)
      },
    },
    { path: ['item', 'show'], summary: 'one item with its criteria, slices and open questions', usage: '<id>', run(c) {
      const k = kit()
      const id = arg(c, 0, 'item id')
      const item = getItem(k, id)
      c.out({ item, criteria: criteria(k, id), slices: slices(k, id), questions: questions(k, id, true), guesses: guesses(k, id, true) }, () => itemBrief(k, id, 4000))
    } },
    { path: ['item', 'list'], summary: 'the items, open first', usage: '[--state s]', flags: { state: { type: 'string', help: 'one state' } }, run(c) {
      const items = listItems(kit(), text(c, 'state'))
      c.out(items, all => (all.length ? all.map(itemLine).join('\n') : 'no items'))
    } },
    { path: ['item', 'edit'], summary: 'change a field of an item', usage: '<id> <title|kind|size|areas|source|rank> <value...> [--if-version n]', flags: VERSION_FLAG, run(c) {
      const value = c.args.slice(2).join(' ')
      if (!value) throw usage('give the value')
      c.out(editItem(kit(), arg(c, 0, 'item id'), arg(c, 1, 'field'), value, ifVersion(c)), itemLine)
    } },
    { path: ['item', 'history'], summary: 'the events of an item', usage: '<id>', run(c) {
      c.out(history(kit(), arg(c, 0, 'item id')), events => events.map(e => `${e.at}  ${e.type.padEnd(8)} ${e.from_state ?? '-'} → ${e.to_state ?? '-'}  ${e.actor} (${e.role})${e.reason ? `  ${e.reason}` : ''}`).join('\n') || 'no events')
    } },
    { path: ['item', 'brief'], summary: 'the context of an item for an agent, at most about 1800 characters', usage: '<id>', run(c) {
      const k = kit()
      const id = arg(c, 0, 'item id')
      const brief = itemBrief(k, id)
      c.out({ id, brief }, () => brief)
    } },
    { path: ['item', 'mode'], summary: 'set the mode of an item: auto runs the stages alone (owner only)', usage: '<id> auto|normal', run(c) {
      c.out(setMode(kit(), arg(c, 0, 'item id'), arg(c, 1, 'mode')), i => `${i.id} mode ${i.mode}`)
    } },
    { path: ['item', 'archive'], summary: 'move the ticket folder to backlog/archive/', usage: '<id>', run(c) {
      c.out({ archived: archiveItem(kit(), arg(c, 0, 'item id')) }, r => `archived to ${r.archived}`)
    } },
    ...moveCommands,
    { path: ['item', 'check'], summary: 'the gaps of the next move, with no move', usage: '<id>', run(c) {
      const k = kit()
      const item = getItem(k, arg(c, 0, 'item id'))
      const move = FORWARD[item.state]
      const found = move ? gaps(k, item, move) : []
      c.out({ id: item.id, state: item.state, move, gaps: found }, r => (!r.move ? `${r.id} is ${r.state}: no forward move` : r.gaps.length ? `${r.move} ${r.id}: ${r.gaps.length} gap${r.gaps.length > 1 ? 's' : ''}\n${formatGaps(r.gaps)}` : `${r.move} ${r.id}: no gap`))
    } },
    { path: ['item', 'ac', 'list'], summary: 'the acceptance criteria with their marks', usage: '<id>', run(c) {
      c.out(criteria(kit(), arg(c, 0, 'item id')), all => all.map(a => `${a.done ? '[x]' : '[ ]'} ${a.n} ${a.text}${a.done ? `  (${a.grade}: ${a.evidence})` : ''}`).join('\n') || 'no criteria')
    } },
    { path: ['item', 'ac', 'add'], summary: 'add a criterion', usage: '<id> <text...> [--tag ADD|CHANGE|REMOVE|NONE]', flags: { tag: { type: 'string', help: 'ADD (default), CHANGE, REMOVE or NONE' } }, run(c) {
      const textValue = c.args.slice(1).join(' ')
      if (!textValue) throw usage('give the text')
      c.out(addCriterion(kit(), arg(c, 0, 'item id'), textValue, text(c, 'tag') ?? 'ADD'), a => `AC ${a.n}: ${a.text}`)
    } },
    { path: ['item', 'ac', 'done'], summary: 'mark a criterion met, with the evidence', usage: '<id> <n> --evidence <text> --grade run|sourced|judged|owner', flags: { evidence: { type: 'string', help: 'what shows it' }, grade: { type: 'string', help: 'run | sourced | judged | owner' } }, run(c) {
      const evidence = text(c, 'evidence')
      const grade = text(c, 'grade')
      if (!evidence || !grade) throw usage('give --evidence and --grade')
      c.out(markCriterion(kit(), arg(c, 0, 'item id'), Number(arg(c, 1, 'criterion number')), evidence, grade), a => `[x] ${a.n} ${a.text} (${a.grade})`)
    } },
    { path: ['item', 'ac', 'undo'], summary: 'clear the mark of a criterion', usage: '<id> <n>', run(c) {
      c.out(unmarkCriterion(kit(), arg(c, 0, 'item id'), Number(arg(c, 1, 'criterion number'))), a => `[ ] ${a.n} ${a.text}`)
    } },
    { path: ['item', 'verify'], summary: 'run the checks of each area of the item; --last prints the last run', usage: '<id> [--area a] [--last]', flags: { area: { type: 'string', help: 'one area only' }, last: { type: 'boolean', help: 'the last run, no new run' } }, run(c) {
      const k = kit()
      const id = arg(c, 0, 'item id')
      const run = c.flags.last ? lastRun(k, getItem(k, id)) : verify(k, id, text(c, 'area'))
      c.out(run, formatRun)
      return run.length && run.every(r => r.result === 'pass') ? Exit.ok : Exit.error
    } },
    { path: ['item', 'branch'], summary: 'kit/<id>-<slug> in each git area of the item', usage: '<id>', run(c) {
      c.out(branchItem(kit(), arg(c, 0, 'item id')), all => all.map(r => `${r.area}: ${r.made ? 'made' : 'on'} ${r.branch}`).join('\n'))
    } },
    { path: ['item', 'commit'], summary: 'one commit for each done slice from its files; the plan without --run; never a push', usage: '<id> [--run]', flags: { run: { type: 'boolean', help: 'make the commits' } }, run(c) {
      const id = arg(c, 0, 'item id')
      const plan = c.flags.run ? commitItem(kit(), id) : commitPlan(kit(), id)
      c.out(plan, p => [
        ...p.entries.map(e => `${e.commit ? `${e.commit} ` : ''}${e.area} (${e.branch ?? 'no branch'}): ${e.message}\n    ${e.files.join(', ')}`),
        ...p.skipped.map(s => `skipped: ${s}`),
        p.entries.length && !c.flags.run ? `run them: kit eng item commit ${id} --run` : '',
      ].filter(Boolean).join('\n') || 'nothing to commit')
    } },
    { path: ['task', 'import'], summary: 'tasks.md into the ledger, by slice id', usage: '<id>', run(c) {
      c.out(importTasks(kit(), arg(c, 0, 'item id')), r => [`created: ${r.created.join(', ') || '-'}`, `updated: ${r.updated.join(', ') || '-'}`, `cancelled: ${r.cancelled.join(', ') || '-'}`, r.kept.length ? `kept: ${r.kept.join(', ')}` : ''].filter(Boolean).join('\n'))
    } },
    { path: ['task', 'list'], summary: 'the slices of an item', usage: '<id> [--ready|--state s]', flags: { ready: { type: 'boolean', help: 'only the slices that can start' }, state: { type: 'string', help: 'one state' } }, run(c) {
      const k = kit()
      const id = arg(c, 0, 'item id')
      const all = c.flags.ready ? readySlices(k, id) : slices(k, id).filter(s => !text(c, 'state') || s.state === text(c, 'state'))
      c.out(all, rows => rows.map(sliceLine).join('\n') || 'no slices')
    } },
    { path: ['task', 'show'], summary: 'one slice', usage: '<id> <T>', run(c) {
      c.out(getSlice(kit(), arg(c, 0, 'item id'), arg(c, 1, 'slice id')), s => `${sliceLine(s)}\n${s.files.length ? `files: ${s.files.join(', ')}\n` : ''}${s.reason ? `reason: ${s.reason}\n` : ''}${s.proof_note ? `proof: ${s.proof_note}` : ''}`)
    } },
    { path: ['task', 'brief'], summary: 'the brief of a slice for a builder', usage: '<id> <T>', run(c) {
      const briefText = taskBrief(kit(), arg(c, 0, 'item id'), arg(c, 1, 'slice id'))
      c.out({ brief: briefText }, () => briefText)
    } },
    ...taskMoveCommands,
    { path: ['task', 'prove'], summary: 'run the new tests of a slice on the base of the branch: proven | weak | none', usage: '<id> <T> --files <f...>', flags: { files: { type: 'string', list: true, help: 'the files of the slice, tests among them' } }, run(c) {
      c.out(prove(kit(), arg(c, 0, 'item id'), arg(c, 1, 'slice id'), list(c, 'files')), p => `${p.slice} ${p.proof}: ${p.note}${p.tests.length ? `\ntests: ${p.tests.join(', ')}` : ''}`)
    } },
    { path: ['ask'], summary: 'ask the owner a question', usage: '<id> <text...> [--blocking] [--rec <answer>]', flags: { blocking: { type: 'boolean', help: 'the item cannot move until it is answered' }, rec: { type: 'string', help: 'the recommended answer' } }, run(c) {
      const q = c.args.slice(1).join(' ')
      c.out(ask(kit(), arg(c, 0, 'item id'), q, c.flags.blocking === true, text(c, 'rec')), r => `${r.id}${r.blocking ? ' (blocking)' : ''}: ${r.text}`)
    } },
    { path: ['answer'], summary: 'answer a question', usage: '<id> <Q> <text...>', run(c) {
      c.out(answer(kit(), arg(c, 0, 'item id'), arg(c, 1, 'question id'), c.args.slice(2).join(' ')), r => `${r.id} answered: ${r.answer}`)
    } },
    { path: ['questions'], summary: 'the questions, of one item or all', usage: '[<id>] [--open]', flags: { open: { type: 'boolean', help: 'open ones only' } }, run(c) {
      c.out(questions(kit(), c.args[0], c.flags.open === true), all => all.map(q => `${q.item} ${q.id} ${q.status}${q.blocking ? ' blocking' : ''}: ${q.text}${q.recommended ? ` (rec: ${q.recommended})` : ''}${q.answer ? ` → ${q.answer}` : ''}`).join('\n') || 'no questions')
    } },
    { path: ['guess'], summary: 'record a guess taken in place of a question', usage: '<id> <question...> --took <a> --other <b> --impact low|med|high [--slices T1,T2]', flags: { took: { type: 'string', help: 'what you took' }, other: { type: 'string', help: 'the other option' }, impact: { type: 'string', help: 'low | med | high' }, slices: { type: 'string', list: true, help: 'the slices that the guess shapes' } }, run(c) {
      const g = addGuess(kit(), arg(c, 0, 'item id'), { question: c.args.slice(1).join(' '), took: text(c, 'took') ?? '', other: text(c, 'other') ?? '', impact: text(c, 'impact') ?? '', slices: list(c, 'slices') })
      c.out(g, r => `${r.id} (${r.impact}): ${r.question} → took "${r.took}"`)
    } },
    { path: ['guesses'], summary: 'the guesses, of one item or all', usage: '[<id>] [--open]', flags: { open: { type: 'boolean', help: 'open ones only' } }, run(c) {
      c.out(guesses(kit(), c.args[0], c.flags.open === true), all => all.map(g => `${g.item} ${g.id} ${g.status} (${g.impact}): ${g.question} → took "${g.took}", not "${g.other}"${g.slices.length ? ` [${g.slices.join(', ')}]` : ''}`).join('\n') || 'no guesses')
    } },
    ...(['accept', 'flip'] as const).map((decision): Command => ({ path: ['guess', decision], summary: decision === 'accept' ? 'keep the guess' : 'flip the guess: its slices go back to todo', usage: '<id> <G> [--answer <text>]', flags: { answer: { type: 'string', help: "the owner's answer" } }, run(c) {
      c.out(decideGuess(kit(), arg(c, 0, 'item id'), arg(c, 1, 'guess id'), decision, text(c, 'answer')), r => `${r.id} ${r.status}${r.reset.length ? `; back to todo: ${r.reset.join(', ')}` : ''}`)
    } })),
    { path: ['next'], summary: 'what to do now, and the skill to type', usage: '[<id>]', run(c) {
      c.out(next(kit(), c.args[0]), formatNext)
    } },
    { path: ['pickup'], summary: 'take an item in this session: the brief and the last handoff', usage: '<id>', run(c) {
      const out = pickup(kit(), arg(c, 0, 'item id'))
      c.out({ brief: out }, () => out)
    } },
    { path: ['quick'], summary: 'a quick fix: an item in cooking with one running slice, no spec and no plan', usage: '<id|title...> --area <a>', flags: { area: { type: 'string', help: 'the one area' } }, run(c) {
      const area = text(c, 'area')
      if (!area) throw usage('give --area')
      c.out(quickItem(kit(), c.args.join(' ') || arg(c, 0, 'id or title'), area), i => `${itemLine(i)}\nT1 is running for you. When done: kit eng item verify ${i.id}; kit eng task done ${i.id} T1 --files <f...>; kit eng item submit ${i.id}; kit eng item ac add ${i.id} "<text>"; then the owner accepts.`)
    } },
    { path: ['note', 'add'], summary: 'add a note to an item', usage: '<id> <text...>', run(c) {
      const noteText = c.args.slice(1).join(' ')
      if (!noteText) throw usage('give the text')
      addNote(kit(), arg(c, 0, 'item id'), noteText)
      c.out({ ok: true }, () => 'noted')
    } },
    { path: ['notes'], summary: 'the notes of an item', usage: '<id>', run(c) {
      c.out(notes(kit(), arg(c, 0, 'item id')), all => all.map(n => `${n.at}  ${n.by}: ${n.text}`).join('\n') || 'no notes')
    } },
    { path: ['adr', 'new'], summary: 'a new architecture decision record in docs/adr/', usage: '<title...> [--item id]', flags: { item: { type: 'string', help: 'the item that led to it' } }, run(c) {
      c.out(newAdr(kit(), c.args.join(' '), text(c, 'item')), a => `ADR ${a.n}: ${a.file}`)
    } },
    { path: ['adr', 'list'], summary: 'the ADRs', run(c) {
      c.out(adrs(kit()), all => all.map(a => `${String(a.n).padStart(4, '0')}  ${a.status.padEnd(10)} ${a.title}${a.item ? `  (${a.item})` : ''}${a.by ? `  → ${a.by}` : ''}`).join('\n') || 'no ADRs')
    } },
    { path: ['adr', 'accept'], summary: 'mark an ADR accepted', usage: '<n>', run(c) {
      c.out(setAdrStatus(kit(), Number(arg(c, 0, 'ADR number')), 'accepted'), a => `ADR ${a.n} ${a.status}`)
    } },
    { path: ['adr', 'supersede'], summary: 'mark an ADR superseded by another', usage: '<n> --by <m>', flags: { by: { type: 'string', help: 'the ADR that replaces it' } }, run(c) {
      c.out(setAdrStatus(kit(), Number(arg(c, 0, 'ADR number')), 'superseded', Number(text(c, 'by'))), a => `ADR ${a.n} ${a.status} by ${a.by}`)
    } },
    { path: ['area', 'list'], summary: 'the areas of kit.yml', run(c) {
      const areas = kit().home.config.areas
      c.out(areas, all => all.map(a => `${a.name.padEnd(12)} ${a.kind.padEnd(9)} ${a.path}${a.checks ? `  checks: ${a.checks.join(' && ') || 'none'}` : '  checks: MISSING'}${a.git ? '' : '  (no git)'}`).join('\n') || 'no areas: add them to kit.yml with /setup')
    } },
    { path: ['area', 'status'], summary: 'folder, kind, branch, dirty files, the item that uses each area', run(c) {
      c.out(areaStatus(kit()), all => all.map(a => `${a.area.padEnd(12)} ${a.kind.padEnd(9)} ${a.path}${a.exists ? '' : ' (missing)'}  ${a.branch ?? '-'}  ${a.dirty} dirty${a.item ? `  used by ${a.item}` : ''}`).join('\n') || 'no areas')
    } },
    { path: ['brief'], summary: 'the lines for `kit brief`: what waits for the owner', run(c) {
      c.out(brief(kit()), all => all.map(l => `${l.urgency.padEnd(5)} ${l.text}\n      ${l.action}`).join('\n') || 'nothing waits for you')
    } },
    { path: ['doctor'], summary: 'the gaps of the pack in this home, each with its fix', run(c) {
      const found = doctor(kit())
      c.out(found, formatFindings)
      return found.some(f => f.level === 'error') ? Exit.error : Exit.ok
    } },
    { path: ['init'], summary: 'make work/, backlog/ and docs/adr/ in the home', run(c) {
      const home = requireHome(process.cwd())
      const made: string[] = []
      for (const dir of [join(home.dir, home.config.dir), join(home.dir, home.config.backlog), adrDir(home)]) {
        if (existsSync(dir)) continue
        mkdirSync(dir, { recursive: true })
        made.push(dir)
      }
      openKit(process.cwd())
      c.out({ home: home.dir, made }, r => (r.made.length ? `made: ${r.made.join(', ')}` : `nothing to make in ${r.home}`))
    } },
    { path: ['hook'], summary: 'run one hook with the Claude Code event on stdin (bash, edit, stop, subagent-stop, teammate-idle, start)', usage: '<name>', async run(c) {
      const name = arg(c, 0, 'hook name')
      const input = await readInput()
      const guards = { bash: bashGuard, edit: editGuard } as const
      if (name in guards) return runHook(() => guards[name as keyof typeof guards](input), true)
      const open = { stop: stopHook, 'subagent-stop': subagentStop, 'teammate-idle': teammateIdle, start: sessionStart } as const
      if (name in open) return runHook(() => open[name as keyof typeof open](input), false)
      c.say(`no hook is named ${name}`)
      return Exit.usage
    } },
  ],
}

/** `--as`, `--actor` and `--session` can sit anywhere in the call; the hook puts them there. They go into the env that role.ts reads. */
function takeRoleFlags(argv: string[]): string[] {
  const rest: string[] = []
  for (let i = 0; i < argv.length; i++) {
    const word = argv[i]!
    const m = /^--(as|actor|session)(?:=(.*))?$/.exec(word)
    if (!m) {
      rest.push(word)
      continue
    }
    const value = m[2] ?? argv[++i] ?? ''
    const key = { as: 'KIT_ROLE', actor: 'KIT_ACTOR', session: 'KIT_SESSION' }[m[1]!]!
    if (value && value !== '-') process.env[key] = value
  }
  return rest
}

process.exit(await run(program, takeRoleFlags(process.argv.slice(2))))
