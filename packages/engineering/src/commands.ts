import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'

import { arg, type Command, type Context, list, type Program, text } from '@kit/shared/cli.ts'
import { Exit, usage } from '@kit/shared/errors.ts'
import { readInput, runHook } from '@kit/shared/hook.ts'

import {
  adrList,
  areaList,
  areaStatusList,
  branchList,
  briefList,
  commitText,
  criterionList,
  eventList,
  findingList,
  guessList,
  importText,
  itemLine,
  itemList,
  nextGapsText,
  nextText,
  noteList,
  questionList,
  runText,
  sliceDetail,
  sliceLine,
  sliceList,
} from './format.ts'
import { Home } from './home.ts'
import { engineeringModule } from './module.ts'
import { hookNamed } from './hooks/index.ts'
import { MOVE_NAMES, SLICE_MOVE_NAMES } from './machine.ts'
import { areaStatus } from './report/areas.ts'
import { brief } from './report/brief.ts'
import { doctor } from './report/doctor.ts'
import { itemBrief, pickup } from './report/item-brief.ts'
import { docPage, itemPage } from './report/item-page.ts'
import { next } from './report/next.ts'
import { taskBrief } from './report/task-brief.ts'
import { Engineering, idAndTitle } from './service.ts'

const eng = () => Engineering.here()
const ifVersion = (c: Context) => text(c, 'if-version')
const rest = (c: Context, from: number) => c.args.slice(from).join(' ')

/** A page goes to stdout, or with `--out` to that file, whose path is printed. */
function printOrWrite(c: Context, id: string, html: string): void {
  const out = text(c, 'out')
  if (!out) return c.out({ id, html }, r => r.html)
  const file = resolve(out)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, `${html}\n`)
  c.out({ id, file }, r => r.file)
}
const VERSION_FLAG = {
  'if-version': { type: 'string', help: 'fail with exit 4 when the record moved past this version' },
} as const

const moveCommands: Command[] = MOVE_NAMES.map(name => ({
  path: ['item', name],
  summary: `move an item: ${name}`,
  usage: '<id> [--reason r] [--if-version n]',
  flags: {
    reason: { type: 'string', help: 'why (needed by the moves back, block and cancel)' },
    ...VERSION_FLAG,
  },
  run(c) {
    const k = eng()
    const result = k.moveItem(name, arg(c, 0, 'item id'), {
      reason: text(c, 'reason'),
      ifVersion: ifVersion(c),
    })
    for (const w of result.warnings) c.say(`warning: ${w}`)
    for (const n of result.notes) c.say(n)
    c.out(
      result.item,
      i => `${i.id} is ${i.state}\n${nextText(next(k, i.id)).split('\n').slice(1).join('\n')}`,
    )
  },
}))

const taskMoveCommands: Command[] = SLICE_MOVE_NAMES.map(name => ({
  path: ['task', name],
  summary: `move a slice: ${name}`,
  usage: '<id> <T> [--reason r] [--files f...] [--if-version n]',
  flags: {
    reason: { type: 'string', help: 'why' },
    files: { type: 'string', list: true, help: 'the files of the slice; repeat or join with a comma' },
    ...VERSION_FLAG,
  },
  run(c) {
    const input = { reason: text(c, 'reason'), files: list(c, 'files'), ifVersion: ifVersion(c) }
    c.out(eng().moveSlice(name, arg(c, 0, 'item id'), arg(c, 1, 'slice id'), input), sliceLine)
  },
}))

const guessDecisions: Command[] = (['accept', 'flip'] as const).map(decision => ({
  path: ['guess', decision],
  summary: decision === 'accept' ? 'keep the guess' : 'flip the guess: its slices go back to todo',
  usage: '<id> <G> [--answer <text>]',
  flags: { answer: { type: 'string', help: "the owner's answer" } },
  run(c) {
    const result = eng().decideGuess(arg(c, 0, 'item id'), arg(c, 1, 'guess id'), decision, text(c, 'answer'))
    c.out(result, r => `${r.id} ${r.status}${r.reset.length ? `; back to todo: ${r.reset.join(', ')}` : ''}`)
  },
}))

const guessSlices: Command = {
  path: ['guess', 'slices'],
  summary: 'name the slices that an open guess shapes, so a flip resets them',
  usage: '<id> <G> --slices T1,T2',
  flags: { slices: { type: 'string', list: true, help: 'the slices; none clears them' } },
  run(c) {
    const guess = eng().setGuessSlices(arg(c, 0, 'item id'), arg(c, 1, 'guess id'), list(c, 'slices'))
    c.out(guess, g => `${g.id} shapes ${g.slices.join(', ') || 'no slice'}`)
  },
}

const itemCommands: Command[] = [
  {
    path: ['item', 'new'],
    summary: 'make an item in the backlog; with no id, the kit makes the next IT-NNN',
    usage: '[<id>] <title...> [--kind k --size s --area a... --source s --backlog]',
    flags: {
      kind: { type: 'string', help: 'feature | fix | chore | investigate' },
      size: { type: 'string', help: 'S | M | L' },
      area: { type: 'string', list: true, help: 'an area of kit.yml; repeat it' },
      source: { type: 'string', help: 'where the item comes from' },
      backlog: { type: 'boolean', help: 'also make backlog/<id>/ticket.md' },
    },
    run(c) {
      const { id, title } = idAndTitle(c.args)
      if (!title) throw usage('give the title')
      const input = {
        id,
        title,
        kind: text(c, 'kind'),
        size: text(c, 'size')?.toUpperCase(),
        areas: list(c, 'area'),
        source: text(c, 'source'),
        backlog: c.flags.backlog === true,
      }
      c.out(eng().newItem(input), itemLine)
    },
  },
  {
    path: ['item', 'show'],
    summary: 'one item with its criteria, slices and open questions',
    usage: '<id>',
    run(c) {
      const k = eng()
      const id = arg(c, 0, 'item id')
      const { criteria, slices, questions, guesses } = k.stores
      const shown = {
        item: k.item(id),
        criteria: criteria.list(id),
        slices: slices.list(id),
        questions: questions.list(id, true),
        guesses: guesses.list(id, true),
      }
      c.out(shown, () => itemBrief(k, id, 4000))
    },
  },
  {
    path: ['item', 'list'],
    summary: 'the items, open first',
    usage: '[--state s]',
    flags: { state: { type: 'string', help: 'one state' } },
    run(c) {
      c.out(eng().stores.items.list(text(c, 'state')), itemList)
    },
  },
  {
    path: ['item', 'edit'],
    summary: 'change a field of an item',
    usage: '<id> <title|kind|size|areas|source|rank> <value...> [--if-version n]',
    flags: VERSION_FLAG,
    run(c) {
      const value = rest(c, 2)
      if (!value) throw usage('give the value')
      c.out(eng().editItem(arg(c, 0, 'item id'), arg(c, 1, 'field'), value, ifVersion(c)), itemLine)
    },
  },
  {
    path: ['item', 'page'],
    summary: 'one HTML page of the item to open from the disk: the spec, the plan, the slices, the walkthrough',
    usage: '<id> [--out <file>] [--tab spec|plan|tasks|walkthrough]',
    flags: {
      out: { type: 'string', help: 'write the page to this file and print its path' },
      tab: { type: 'string', help: 'the tab that the page opens on' },
    },
    run(c) {
      const id = arg(c, 0, 'item id')
      printOrWrite(c, id, itemPage(eng(), id, text(c, 'tab')))
    },
  },
  {
    path: ['doc', 'page'],
    summary: 'one HTML page of a Markdown file with no item, such as the walkthrough of a question, to open from the disk',
    usage: '<file.md> [--out <file>]',
    flags: { out: { type: 'string', help: 'write the page to this file and print its path' } },
    run(c) {
      const path = arg(c, 0, 'Markdown file')
      const source = resolve(path)
      if (!existsSync(source)) throw usage(`no file ${path}`)
      printOrWrite(c, path, docPage(relative(process.cwd(), source), readFileSync(source, 'utf8')))
    },
  },
  {
    path: ['item', 'history'],
    summary: 'the events of an item',
    usage: '<id>',
    run(c) {
      c.out(eng().stores.events.history(arg(c, 0, 'item id')), eventList)
    },
  },
  {
    path: ['item', 'brief'],
    summary: 'the context of an item for an agent, at most about 1800 characters',
    usage: '<id>',
    run(c) {
      const id = arg(c, 0, 'item id')
      const out = itemBrief(eng(), id)
      c.out({ id, brief: out }, () => out)
    },
  },
  {
    path: ['item', 'mode'],
    summary: 'set the mode of an item: auto runs the stages alone (owner only)',
    usage: '<id> auto|normal',
    run(c) {
      c.out(eng().setMode(arg(c, 0, 'item id'), arg(c, 1, 'mode')), i => `${i.id} mode ${i.mode}`)
    },
  },
  {
    path: ['item', 'archive'],
    summary: 'move the ticket folder to backlog/archive/',
    usage: '<id>',
    run(c) {
      c.out({ archived: eng().archive(arg(c, 0, 'item id')) }, r => (r.archived ? `archived to ${r.archived}` : 'no ticket folder: nothing to archive'))
    },
  },
  ...moveCommands,
  {
    path: ['item', 'check'],
    summary: 'the gaps of the next move, with no move',
    usage: '<id>',
    run(c) {
      c.out(eng().nextGaps(arg(c, 0, 'item id')), nextGapsText)
    },
  },
]

const criterionCommands: Command[] = [
  {
    path: ['item', 'ac', 'list'],
    summary: 'the acceptance criteria with their marks',
    usage: '<id>',
    run(c) {
      c.out(eng().stores.criteria.list(arg(c, 0, 'item id')), criterionList)
    },
  },
  {
    path: ['item', 'ac', 'add'],
    summary: 'add a criterion',
    usage: '<id> <text...> [--tag ADD|CHANGE|REMOVE|NONE]',
    flags: { tag: { type: 'string', help: 'ADD (default), CHANGE, REMOVE or NONE' } },
    run(c) {
      const line = rest(c, 1)
      if (!line) throw usage('give the text')
      c.out(
        eng().addCriterion(arg(c, 0, 'item id'), line, text(c, 'tag') ?? 'ADD'),
        a => `AC ${a.n}: ${a.text}`,
      )
    },
  },
  {
    path: ['item', 'ac', 'done'],
    summary: 'mark a criterion met, with the evidence',
    usage: '<id> <n> --evidence <text> --grade run|sourced|judged|owner',
    flags: {
      evidence: { type: 'string', help: 'what shows it' },
      grade: { type: 'string', help: 'run | sourced | judged | owner' },
    },
    run(c) {
      const evidence = text(c, 'evidence')
      const grade = text(c, 'grade')
      if (!evidence || !grade) throw usage('give --evidence and --grade')
      c.out(
        eng().markCriterion(arg(c, 0, 'item id'), Number(arg(c, 1, 'criterion number')), evidence, grade),
        a => `[x] ${a.n} ${a.text} (${a.grade})`,
      )
    },
  },
  {
    path: ['item', 'ac', 'undo'],
    summary: 'clear the mark of a criterion',
    usage: '<id> <n>',
    run(c) {
      c.out(
        eng().unmarkCriterion(arg(c, 0, 'item id'), Number(arg(c, 1, 'criterion number'))),
        a => `[ ] ${a.n} ${a.text}`,
      )
    },
  },
]

const checkCommands: Command[] = [
  {
    path: ['item', 'verify'],
    summary: 'run the checks of each area of the item; --last prints the last run',
    usage: '<id> [--area a] [--last]',
    flags: {
      area: { type: 'string', help: 'one area only' },
      last: { type: 'boolean', help: 'the last run, no new run' },
    },
    run(c) {
      const id = arg(c, 0, 'item id')
      const run = c.flags.last ? eng().lastRun(id) : eng().verify(id, text(c, 'area'))
      c.out(run, runText)
      return run.length && run.every(r => r.result === 'pass') ? Exit.ok : Exit.error
    },
  },
  {
    path: ['item', 'branch'],
    summary: 'kit/<id>-<slug> in each git area of the item',
    usage: '<id>',
    run(c) {
      c.out(eng().branch(arg(c, 0, 'item id')), branchList)
    },
  },
  {
    path: ['item', 'commit'],
    summary: 'one commit for each done slice from its files; the plan without --run; never a push',
    usage: '<id> [--run]',
    flags: { run: { type: 'boolean', help: 'make the commits' } },
    run(c) {
      const id = arg(c, 0, 'item id')
      const ran = c.flags.run === true
      c.out(ran ? eng().commit(id) : eng().commitPlan(id), plan => commitText(plan, id, ran))
    },
  },
]

const sliceCommands: Command[] = [
  {
    path: ['task', 'import'],
    summary: 'tasks.md into the ledger, by slice id',
    usage: '<id>',
    run(c) {
      c.out(eng().importTasks(arg(c, 0, 'item id')), importText)
    },
  },
  {
    path: ['task', 'list'],
    summary: 'the slices of an item',
    usage: '<id> [--ready|--state s]',
    flags: {
      ready: { type: 'boolean', help: 'only the slices that can start' },
      state: { type: 'string', help: 'one state' },
    },
    run(c) {
      const slices = eng().stores.slices
      const id = arg(c, 0, 'item id')
      const state = text(c, 'state')
      c.out(
        c.flags.ready ? slices.ready(id) : slices.list(id).filter(s => !state || s.state === state),
        sliceList,
      )
    },
  },
  {
    path: ['task', 'show'],
    summary: 'one slice',
    usage: '<id> <T>',
    run(c) {
      c.out(eng().stores.slices.get(arg(c, 0, 'item id'), arg(c, 1, 'slice id')), sliceDetail)
    },
  },
  {
    path: ['task', 'brief'],
    summary: 'the brief of a slice for a builder',
    usage: '<id> <T>',
    run(c) {
      const out = taskBrief(eng(), arg(c, 0, 'item id'), arg(c, 1, 'slice id'))
      c.out({ brief: out }, () => out)
    },
  },
  ...taskMoveCommands,
  {
    path: ['task', 'prove'],
    summary: 'run the new tests of a slice on the base of the branch: proven | weak | none',
    usage: '<id> <T> --files <f...>',
    flags: { files: { type: 'string', list: true, help: 'the files of the slice, tests among them' } },
    run(c) {
      const proved = eng().prove(arg(c, 0, 'item id'), arg(c, 1, 'slice id'), list(c, 'files'))
      c.out(
        proved,
        p => `${p.slice} ${p.proof}: ${p.note}${p.tests.length ? `\ntests: ${p.tests.join(', ')}` : ''}`,
      )
    },
  },
]

const questionCommands: Command[] = [
  {
    path: ['ask'],
    summary: 'ask the owner a question',
    usage: '<id> <text...> [--blocking] [--rec <answer>]',
    flags: {
      blocking: { type: 'boolean', help: 'the item cannot move until it is answered' },
      rec: { type: 'string', help: 'the recommended answer' },
    },
    run(c) {
      const q = eng().ask(arg(c, 0, 'item id'), rest(c, 1), c.flags.blocking === true, text(c, 'rec'))
      c.out(q, r => `${r.id}${r.blocking ? ' (blocking)' : ''}: ${r.text}`)
    },
  },
  {
    path: ['answer'],
    summary: 'answer a question',
    usage: '<id> <Q> <text...>',
    run(c) {
      c.out(
        eng().answer(arg(c, 0, 'item id'), arg(c, 1, 'question id'), rest(c, 2)),
        r => `${r.id} answered: ${r.answer}`,
      )
    },
  },
  {
    path: ['questions'],
    summary: 'the questions, of one item or all',
    usage: '[<id>] [--open]',
    flags: { open: { type: 'boolean', help: 'open ones only' } },
    run(c) {
      c.out(eng().stores.questions.list(c.args[0], c.flags.open === true), questionList)
    },
  },
  {
    path: ['guess'],
    summary: 'record a guess taken in place of a question',
    usage: '<id> <question...> --took <a> --other <b> --impact low|med|high [--slices T1,T2]',
    flags: {
      took: { type: 'string', help: 'what you took' },
      other: { type: 'string', help: 'the other option' },
      impact: { type: 'string', help: 'low | med | high' },
      slices: { type: 'string', list: true, help: 'the slices that the guess shapes' },
    },
    run(c) {
      const input = {
        question: rest(c, 1),
        took: text(c, 'took') ?? '',
        other: text(c, 'other') ?? '',
        impact: text(c, 'impact') ?? '',
        slices: list(c, 'slices'),
      }
      c.out(
        eng().addGuess(arg(c, 0, 'item id'), input),
        r => `${r.id} (${r.impact}): ${r.question} → took "${r.took}"`,
      )
    },
  },
  {
    path: ['guesses'],
    summary: 'the guesses, of one item or all',
    usage: '[<id>] [--open]',
    flags: { open: { type: 'boolean', help: 'open ones only' } },
    run(c) {
      c.out(eng().stores.guesses.list(c.args[0], c.flags.open === true), guessList)
    },
  },
  ...guessDecisions,
  guessSlices,
]

const dayCommands: Command[] = [
  {
    path: ['next'],
    summary: 'what to do now, and the skill to type',
    usage: '[<id>]',
    run(c) {
      c.out(next(eng(), c.args[0]), nextText)
    },
  },
  {
    path: ['pickup'],
    summary: 'take an item in this session: the brief and the last handoff',
    usage: '<id>',
    run(c) {
      const out = pickup(eng(), arg(c, 0, 'item id'))
      c.out({ brief: out }, () => out)
    },
  },
  {
    path: ['quick'],
    summary: 'a quick fix: an item in cooking with one running slice, no spec and no plan',
    usage: '<id|title...> --area <a>',
    flags: { area: { type: 'string', help: 'the one area' } },
    run(c) {
      const area = text(c, 'area')
      if (!area) throw usage('give --area')
      const item = eng().quick(rest(c, 0) || arg(c, 0, 'id or title'), area)
      const id = item.id
      c.out(
        item,
        i =>
          `${itemLine(i)}\nT1 is running for you. When done: kit eng item verify ${id}; kit eng task done ${id} T1 --files <f...>; kit eng item submit ${id}; kit eng item ac add ${id} "<text>"; then the owner accepts.`,
      )
    },
  },
  {
    path: ['note', 'add'],
    summary: 'add a note to an item',
    usage: '<id> <text...>',
    run(c) {
      const note = rest(c, 1)
      if (!note) throw usage('give the text')
      eng().addNote(arg(c, 0, 'item id'), note)
      c.out({ ok: true }, () => 'noted')
    },
  },
  {
    path: ['notes'],
    summary: 'the notes of an item',
    usage: '<id>',
    run(c) {
      c.out(eng().stores.notes.list(arg(c, 0, 'item id')), noteList)
    },
  },
]

const adrCommands: Command[] = [
  {
    path: ['adr', 'new'],
    summary: 'a new architecture decision record in docs/adr/',
    usage: '<title...> [--item id]',
    flags: { item: { type: 'string', help: 'the item that led to it' } },
    run(c) {
      c.out(eng().newAdr(rest(c, 0), text(c, 'item')), a => `ADR ${a.n}: ${a.file}`)
    },
  },
  {
    path: ['adr', 'list'],
    summary: 'the ADRs',
    run(c) {
      c.out(eng().stores.adrs.list(), adrList)
    },
  },
  {
    path: ['adr', 'accept'],
    summary: 'mark an ADR accepted',
    usage: '<n>',
    run(c) {
      c.out(eng().setAdrStatus(Number(arg(c, 0, 'ADR number')), 'accepted'), a => `ADR ${a.n} ${a.status}`)
    },
  },
  {
    path: ['adr', 'supersede'],
    summary: 'mark an ADR superseded by another',
    usage: '<n> --by <m>',
    flags: { by: { type: 'string', help: 'the ADR that replaces it' } },
    run(c) {
      c.out(
        eng().setAdrStatus(Number(arg(c, 0, 'ADR number')), 'superseded', Number(text(c, 'by'))),
        a => `ADR ${a.n} ${a.status} by ${a.by}`,
      )
    },
  },
]

const homeCommands: Command[] = [
  {
    path: ['area', 'list'],
    summary: 'the areas of kit.yml',
    run(c) {
      c.out(eng().home.config.areas, areaList)
    },
  },
  {
    path: ['area', 'status'],
    summary: 'folder, kind, branch, dirty files, the item that uses each area',
    run(c) {
      c.out(areaStatus(eng()), areaStatusList)
    },
  },
  {
    path: ['brief'],
    summary: 'the lines for `kit brief`: what waits for the owner',
    run(c) {
      c.out(brief(eng()), briefList)
    },
  },
  {
    path: ['doctor'],
    summary: 'the gaps of the pack in this home, each with its fix',
    run(c) {
      const found = doctor(eng())
      c.out(found, findingList)
      return found.some(f => f.level === 'error') ? Exit.error : Exit.ok
    },
  },
  {
    path: ['init'],
    summary: 'make work/, backlog/ and docs/adr/ in the home',
    run(c) {
      const home = Home.require()
      const made = engineeringModule.setup(home.dir)
      c.out({ home: home.dir, made }, r =>
        r.made.length ? `made: ${r.made.join(', ')}` : `nothing to make in ${r.home}`,
      )
    },
  },
  {
    path: ['hook'],
    summary:
      'run one hook with the Claude Code event on stdin (bash, edit, stop, subagent-stop, teammate-idle, start)',
    usage: '<name>',
    async run(c) {
      const name = arg(c, 0, 'hook name')
      const input = await readInput()
      const hook = hookNamed(name)
      if (hook) return runHook(() => hook.run(input), hook.closed)
      c.say(`no hook is named ${name}`)
      return Exit.usage
    },
  },
]

export const engineeringProgram: Program = {
  name: 'kit eng',
  summary: 'the engineering pack of Harness Kit: items, slices, gates and proofs',
  commands: [
    ...itemCommands,
    ...criterionCommands,
    ...checkCommands,
    ...sliceCommands,
    ...questionCommands,
    ...dayCommands,
    ...adrCommands,
    ...homeCommands,
  ],
}

const ROLE_ENV: Record<string, string> = { as: 'KIT_ROLE', actor: 'KIT_ACTOR', session: 'KIT_SESSION' }

/** `--as`, `--actor` and `--session` can sit anywhere in the call; they go into the env of `Who.fromEnv`. */
export function takeRoleFlags(argv: string[]): string[] {
  const kept: string[] = []
  for (let i = 0; i < argv.length; i++) {
    const word = argv[i]!
    const flag = /^--(as|actor|session)(?:=(.*))?$/.exec(word)
    if (!flag) {
      kept.push(word)
      continue
    }
    const value = flag[2] ?? argv[++i] ?? ''
    if (value && value !== '-') process.env[ROLE_ENV[flag[1]!]!] = value
  }
  return kept
}
