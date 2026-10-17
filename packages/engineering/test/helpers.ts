import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { Home } from '../src/home.ts'
import { Engineering } from '../src/service.ts'
import { Who } from '../src/who.ts'

/** A temporary home: nook.yml with the engineering pack and two areas that are small git repos. */

process.env.NOOK_PROJECT = join(import.meta.dir, '..', '..', '..')
Object.assign(process.env, { GIT_AUTHOR_NAME: 'nook test', GIT_AUTHOR_EMAIL: 'test@example.com', GIT_COMMITTER_NAME: 'nook test', GIT_COMMITTER_EMAIL: 'test@example.com' })

export const OWNER = new Who('owner', 'owner', null)
export const LEAD = new Who('lead', 'lead', 'sess-1')
export const BUILDER = new Who('builder', 'backend-builder-ab12', 'sess-1')
export const READER = new Who('reader', 'verifier-cd34', 'sess-1')

/** The test runner of an area: each file argument is a shell test; with no argument the FAIL marker decides. */
const TEST_SH = `#!/bin/sh
if [ $# -eq 0 ]; then [ -f FAIL ] && { echo "check failed: FAIL marker"; exit 1; }; echo "checks ok"; exit 0; fi
code=0
for f in "$@"; do sh "$f" || { echo "FAIL $f"; code=1; }; done
exit $code
`

export type TestHome = {
  root: string
  home: Home
  eng(who?: Who): Engineering
  area(name: string): string
  fail(name: string, on: boolean): void
  git(name: string, ...args: string[]): string
  cleanup(): void
}

/** `dir: null` leaves the item folder out of nook.yml, so the default holds. */
export function makeHome(options: { section?: boolean; checks?: boolean; dir?: string | null } = {}): TestHome {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'nook-eng-')))
  const areas = ['bff', 'web']
  for (const name of areas) {
    const dir = join(root, 'projects', name)
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'test.sh'), TEST_SH)
    writeFileSync(join(dir, 'README.md'), `# ${name}\n`)
    writeFileSync(join(dir, '.gitignore'), 'FAIL\n')
    run(dir, 'git', 'init', '-q', '-b', 'main')
    run(dir, 'git', 'add', '-A')
    run(dir, 'git', 'commit', '-q', '-m', 'init')
  }
  const checks = options.checks === false ? '' : 'checks: [sh test.sh]'
  const dir = options.dir === undefined ? 'works' : options.dir
  const section = options.section === false ? '' : `engineering:
${dir ? `  dir: ${dir}\n` : ''}  backlog: backlog
  protected: [main, master]
  areas:
    - { name: bff, path: projects/bff, kind: backend, ${checks ? `${checks}, ` : ''}test: "sh test.sh {files}" }
    - { name: web, path: projects/web, kind: frontend, checks: [sh test.sh], test: "sh test.sh {files}" }
`
  writeFileSync(join(root, 'nook.yml'), `packs: [engineering]\n${section}`)
  mkdirSync(join(root, dir ?? 'works'), { recursive: true })
  const home = Home.find(root)!
  return {
    root,
    home,
    eng: (who = OWNER) => Engineering.open(home, who),
    area: name => join(root, 'projects', name),
    fail(name, on) {
      const marker = join(root, 'projects', name, 'FAIL')
      if (on) writeFileSync(marker, '')
      else rmSync(marker, { force: true })
    },
    git: (name, ...args) => run(join(root, 'projects', name), 'git', ...args),
    cleanup: () => rmSync(root, { recursive: true, force: true }),
  }
}

export function run(cwd: string, ...command: string[]): string {
  const result = Bun.spawnSync(command, { cwd, stdout: 'pipe', stderr: 'pipe', env: process.env })
  if (result.exitCode !== 0) throw new Error(`${command.join(' ')} failed: ${result.stderr.toString()}`)
  return result.stdout.toString().trim()
}

export const SPEC = (options: { kind?: string; areas?: string[]; acs?: string[]; questions?: string[]; size?: string } = {}) => {
  const kind = options.kind ?? 'feature'
  const acs = options.acs ?? ['[ADD] the export has the right date', '[CHANGE] the error shows a reason']
  const tail = kind === 'investigate'
    ? `## Questions\n\n${(options.questions ?? ['why does the job retry?']).map(q => `- ${q}`).join('\n')}\n`
    : `## Acceptance criteria\n\n${acs.map(a => `- ${a}`).join('\n')}\n`
  return `---\nid: SHOP-1\nkind: ${kind}\nsize: ${options.size ?? 'S'}\nareas: [${(options.areas ?? ['bff']).join(', ')}]\ncreated: 2026-10-14\nupdated: 2026-10-15\n---\n\n# SHOP-1: the export date is off\n\n> In short: the export shows the date of the shop.\n\n## Why\n\nFix the export date.\n\n## What changes\n\n- **bff:** shift the date.\n\n${tail}\n## Decisions\n\n| Point | Answer | From |\n|---|---|---|\n| The zone | UTC | Q1 |\n\n## Out of scope\n\nNothing.\n`
}

export const PLAN = `---\nid: SHOP-1\napproach: format the date in UTC\ncreated: 2026-10-14\nupdated: 2026-10-15\n---\n\n# SHOP-1: the plan\n\n> In short: format in UTC. The risk is the time zones.\n\n## Today\n\nThe export formats the date in the zone of the server.\n\n## Approach\n\n| Decision | Why |\n|---|---|\n| Use UTC | one zone for every shop |\n\n## Impact\n\nNone: Contract, Data, Cache, Consistency, Performance, Security, Rollout.\n\n## Proof\n\n| AC | Layer | Proof |\n|---|---|---|\n| 1, 2 | bff, unit | a date test and a negative |\n\n## Risks\n\nTime zones.\n`

export const TASKS = (slices: { id: string; area?: string; depends?: string; acs?: string; proof?: string; title?: string }[]) =>
  `---\nid: SHOP-1\ncreated: 2026-10-14\nupdated: 2026-10-15\n---\n\n# SHOP-1: the slices\n\n${slices.map(s => `## ${s.id}: ${s.title ?? `slice ${s.id}`}\n\n- area: ${s.area ?? 'bff'}\n- depends: ${s.depends ?? 'none'}\n- acs: ${s.acs ?? '1, 2'}\n- size: S\n- done when: the test passes\n${s.proof ? `- proof: ${s.proof}\n` : ''}`).join('\n')}`

export const writeDoc = (t: TestHome, id: string, name: string, text: string) => {
  mkdirSync(t.home.workDir(id), { recursive: true })
  writeFileSync(join(t.home.workDir(id), name), text)
}

/** An item taken to a state through the real moves, with one slice T1 in bff. */
export function itemAt(t: TestHome, state: 'backlog' | 'framing' | 'planning' | 'ready' | 'cooking' | 'review', id = 'SHOP-1', spec = SPEC(), tasks = TASKS([{ id: 'T1' }])) {
  const lead = t.eng(LEAD)
  const owner = t.eng(OWNER)
  lead.newItem({ id, title: 'the export date is off', kind: 'feature', size: 'S', areas: ['bff'] })
  if (state === 'backlog') return
  lead.moveItem('start', id)
  if (state === 'framing') return
  writeDoc(t, id, 'spec.md', spec.replaceAll('SHOP-1', id))
  lead.moveItem('agree', id)
  if (state === 'planning') return
  writeDoc(t, id, 'plan.md', PLAN)
  writeDoc(t, id, 'tasks.md', tasks)
  lead.importTasks(id)
  owner.moveItem('approve', id)
  if (state === 'ready') return
  const areas = /areas: \[([^\]]*)\]/.exec(spec)?.[1]?.split(',').map(s => s.trim()) ?? ['bff']
  for (const area of areas) t.git(area, 'switch', '-q', '-c', `nook/${id}-work`)
  lead.moveItem('begin', id)
  if (state === 'cooking') return
  throw new Error('itemAt: review needs the slices done and a verify; do it in the test')
}
