import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

import { init } from '@nook/core/init/initializer.ts'
import { Catalog } from '@nook/desk/catalog.ts'
import { Home } from '@nook/engineering/home.ts'
import { engineeringModule } from '@nook/engineering/module.ts'
import { Engineering } from '@nook/engineering/service.ts'
import { Who } from '@nook/engineering/who.ts'
import { runCommand } from '@nook/shared/run.ts'

/**
 * A demo desk with mock work items for the web app: six items, one in each state of the flow.
 * The items go through the real moves of the ledger, as an agent and the owner make them, so every guard passes.
 * Run: bun run demo <dir>; the folder must be empty or new.
 */

const FIXTURES = join(import.meta.dirname)
const OWNER = new Who('owner', 'owner', null)
const LEAD = new Who('lead', 'lead', 'demo')
const API_BUILDER = new Who('builder', 'backend-builder-a1', 'demo')
const WEB_BUILDER = new Who('builder', 'frontend-builder-b2', 'demo')

const NOOK_YML = `packs: [engineering]
secrets: []

engineering:
  areas:
    - { name: api, path: projects/api, kind: backend, checks: [sh check.sh], test: "sh check.sh {files}" }
    - { name: web, path: projects/web, kind: frontend, checks: [sh check.sh], test: "sh check.sh {files}" }
    - { name: worker, path: projects/worker, kind: backend, checks: [sh check.sh], test: "sh check.sh {files}" }
`

// a check passes unless the area holds a FAIL file, which names the failing test
const CHECK_SH = `#!/bin/sh
if [ -f FAIL ]; then cat FAIL; exit 1; fi
echo "12 pass"
`

function git(dir: string, ...args: string[]): void {
  const run = runCommand(['git', ...args], { cwd: dir })
  if (run.code !== 0) throw new Error(`git ${args.join(' ')} in ${dir}: ${run.err}`)
}

function write(dir: string, files: Record<string, string>): void {
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true })
    writeFileSync(join(dir, path), text)
  }
}

/** A git area on main with its check script and a first commit. */
function makeArea(desk: string, name: string, files: Record<string, string>): void {
  const dir = join(desk, 'projects', name)
  write(dir, { 'check.sh': CHECK_SH, '.gitignore': 'FAIL\n', 'README.md': `# ${name}\n`, ...files })
  git(dir, 'init', '-q', '-b', 'main')
  git(dir, 'add', '-A')
  git(dir, '-c', 'user.name=demo', '-c', 'user.email=demo@example.com', 'commit', '-q', '-m', 'first commit')
}

/** Commits files on the branch that the area is on, as a builder would. */
function commit(desk: string, area: string, message: string, files: Record<string, string>): void {
  const dir = join(desk, 'projects', area)
  write(dir, files)
  git(dir, 'add', '-A')
  git(dir, '-c', 'user.name=demo', '-c', 'user.email=demo@example.com', 'commit', '-q', '-m', message)
}

const docOf = (id: string, name: string) => readFileSync(join(FIXTURES, 'items', id, name), 'utf8')

class Demo {
  readonly home: Home
  constructor(readonly desk: string) {
    this.home = Home.require(desk)
  }

  as(who: Who): Engineering {
    return Engineering.open(this.home, who)
  }

  doc(id: string, name: string): void {
    write(this.home.workDir(id), { [name]: docOf(id, name) })
  }

  /** An item from new to cooking: the spec, the agree, the plan and the slices, the approve, the branch and the begin. */
  toCooking(id: string, title: string, size: string, areas: string[], before?: { agree?: () => void }): void {
    const lead = this.as(LEAD)
    this.toPlanning(id, title, size, areas, before)
    this.doc(id, 'plan.md')
    this.doc(id, 'tasks.md')
    lead.importTasks(id)
    this.as(OWNER).moveItem('approve', id)
    lead.branch(id)
    lead.moveItem('begin', id)
  }

  toPlanning(id: string, title: string, size: string, areas: string[], before?: { agree?: () => void }): void {
    const lead = this.as(LEAD)
    lead.newItem({ id, title, kind: 'feature', size, areas })
    lead.moveItem('start', id)
    this.doc(id, 'spec.md')
    before?.agree?.()
    lead.moveItem('agree', id)
  }

  finish(id: string, slice: string, who: Who, files: string[]): void {
    const builder = this.as(who)
    builder.moveSlice('start', id, slice)
    builder.moveSlice('done', id, slice, { files })
  }
}

function buildItems(demo: Demo): void {
  const desk = demo.desk
  const lead = () => demo.as(LEAD)

  // SHOP-41, done: built on its branch, merged back into main of api
  demo.toCooking('SHOP-41', 'Show the order total with tax', 'S', ['api'])
  commit(desk, 'api', 'SHOP-41: the tax line', { 'src/orders/tax.ts': 'export const RATES = { FR: 0.2, DE: 0.19, VN: 0.1 }\n', 'src/orders/total.ts': 'export const total = 1\n' })
  demo.finish('SHOP-41', 'T1', API_BUILDER, ['src/orders/tax.ts', 'src/orders/total.ts'])
  lead().verify('SHOP-41')
  lead().moveItem('submit', 'SHOP-41')
  lead().markCriterion('SHOP-41', 1, 'tax.test.ts: a French order adds 20%', 'run')
  lead().markCriterion('SHOP-41', 2, 'tax.test.ts: no country, no tax line', 'run')
  demo.doc('SHOP-41', 'walkthrough.md')
  demo.as(OWNER).moveItem('accept', 'SHOP-41')
  const api = join(desk, 'projects', 'api')
  const branch = runCommand(['git', 'branch', '--show-current'], { cwd: api }).out.trim()
  git(api, 'switch', '-q', 'main')
  git(api, 'merge', '-q', '--ff-only', branch)

  // SHOP-44, review: one slice done, the checks passed, one criterion met so far
  demo.toCooking('SHOP-44', 'Send a mail when an order ships', 'S', ['worker'])
  commit(desk, 'worker', 'SHOP-44: the shipped mail', { 'src/jobs/shipped-mail.ts': 'export const job = 1\n', 'src/mail/templates.ts': 'export const shipped = 1\n' })
  demo.finish('SHOP-44', 'T1', API_BUILDER, ['src/jobs/shipped-mail.ts'])
  lead().verify('SHOP-44')
  lead().moveItem('submit', 'SHOP-44')
  lead().markCriterion('SHOP-44', 1, 'shipped-mail.test.ts: one mail with the link', 'run')
  demo.doc('SHOP-44', 'walkthrough.md')

  // SHOP-42, cooking: slices in every state, questions and guesses that wait for the owner, a failing check
  demo.toCooking('SHOP-42', 'Pay for an order with a saved card', 'L', ['api', 'web'])
  const q1 = lead().ask('SHOP-42', 'Which cards can a customer save?', false, 'Visa and Mastercard')
  lead().answer('SHOP-42', q1.id, 'Visa and Mastercard; the vault refuses the rest.')
  lead().ask('SHOP-42', 'Must a refund after 30 days go to the same card, or to store credit?', true, 'the same card')
  lead().ask('SHOP-42', 'Must the card list show the expiry date?', false)
  const g1 = lead().addGuess('SHOP-42', { question: 'Where does the last 4 digits come from?', took: 'the vault answer', other: 'the card form', impact: 'low', slices: ['T1'] })
  demo.as(OWNER).decideGuess('SHOP-42', g1.id, 'accept')
  lead().addGuess('SHOP-42', { question: 'When does a declined charge try again?', took: 'after 1, 5 and 30 minutes', other: 'once after an hour', impact: 'high', slices: ['T4'] })
  commit(desk, 'api', 'SHOP-42: saved cards and the charge', {
    'src/payments/cards.ts': 'export const cards = 1\n',
    'src/payments/vault.ts': 'export const vault = 1\n',
    'src/payments/retry.ts': 'export const retry = 1\n',
    'src/orders/total.ts': 'export const total = 2\n',
  })
  commit(desk, 'web', 'SHOP-42: saved cards at checkout', { 'src/checkout/SavedCards.tsx': 'export const SavedCards = 1\n', 'src/checkout/Checkout.tsx': 'export const Checkout = 2\n' })
  demo.finish('SHOP-42', 'T1', API_BUILDER, ['src/payments/cards.ts'])
  demo.finish('SHOP-42', 'T2', API_BUILDER, ['src/payments/vault.ts'])
  demo.as(WEB_BUILDER).moveSlice('start', 'SHOP-42', 'T3')
  const api42 = demo.as(API_BUILDER)
  api42.moveSlice('start', 'SHOP-42', 'T4')
  api42.moveSlice('fail', 'SHOP-42', 'T4', { reason: 'the clock fake skips the 5 minute try' })
  api42.moveSlice('start', 'SHOP-42', 'T5')
  api42.moveSlice('wait', 'SHOP-42', 'T5', { reason: 'waits for Q2: the refund rule after 30 days' })
  writeFileSync(join(desk, 'projects', 'web', 'FAIL'), '1 failing: SavedCards shows no card for a new customer\n')
  lead().verify('SHOP-42')
  lead().markCriterion('SHOP-42', 1, 'cards.test.ts: a saved card pays by its id', 'run')

  // SHOP-43, planning: the plan waits for the approve of the owner
  demo.toPlanning('SHOP-43', 'Export the order list as CSV', 'M', ['api', 'web'])
  demo.doc('SHOP-43', 'plan.md')
  demo.doc('SHOP-43', 'tasks.md')
  lead().importTasks('SHOP-43')
  lead().addGuess('SHOP-43', { question: 'Which time zone ends a month?', took: 'the zone of the shop', other: 'UTC', impact: 'med', slices: ['T1'] })

  // SHOP-45, framing: the spec is being written; SHOP-46, backlog
  lead().newItem({ id: 'SHOP-45', title: 'Search orders by customer email', kind: 'feature', size: 'M', areas: ['api', 'web'] })
  lead().moveItem('start', 'SHOP-45')
  demo.doc('SHOP-45', 'spec.md')
  lead().newItem({ id: 'SHOP-46', title: 'Dark mode for the shop admin', kind: 'feature', size: 'S', areas: ['web'] })
}

export function buildDemo(target: string): string {
  const desk = resolve(target)
  if (existsSync(desk) && readdirSync(desk).length) throw new Error(`${desk} is not empty: give a new or empty folder`)
  mkdirSync(desk, { recursive: true })
  writeFileSync(join(desk, 'nook.yml'), NOOK_YML)
  makeArea(desk, 'api', { 'src/orders/total.ts': 'export const total = 0\n' })
  makeArea(desk, 'web', { 'src/checkout/Checkout.tsx': 'export const Checkout = 1\n' })
  makeArea(desk, 'worker', { 'src/mail/templates.ts': 'export const receipt = 1\n' })
  init({ dir: desk, packs: ['engineering'], update: false, coreDir: Catalog.load().dirOf('core'), modules: [engineeringModule] })
  buildItems(new Demo(desk))
  return desk
}

if (import.meta.main) {
  const [target] = process.argv.slice(2)
  if (!target) {
    console.error('usage: bun run demo <dir>')
    process.exit(2)
  }
  const desk = buildDemo(target)
  console.log(`A demo desk is ready in ${desk}.\nOpen it from a terminal outside Claude Code:\n  cd ${desk}\n  nook web`)
}
