import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { dbFile, findHome, type Home } from '../src/home.ts'
import { openDb } from '../src/db.ts'
import type { Kit } from '../src/kit.ts'
import { moveItem } from '../src/model/moves.ts'
import { newItem } from '../src/model/items.ts'
import { importTasks } from '../src/model/slices.ts'
import type { Who } from '../src/role.ts'

/** A temporary home: kit.yml with the engineering pack and two areas that are small git repos. */

process.env.KIT_PROJECT = join(import.meta.dir, '..', '..', '..')
Object.assign(process.env, { GIT_AUTHOR_NAME: 'kit test', GIT_AUTHOR_EMAIL: 'test@example.com', GIT_COMMITTER_NAME: 'kit test', GIT_COMMITTER_EMAIL: 'test@example.com' })

export const OWNER: Who = { role: 'owner', actor: 'owner', session: null }
export const LEAD: Who = { role: 'lead', actor: 'lead', session: 'sess-1' }
export const BUILDER: Who = { role: 'builder', actor: 'backend-builder-ab12', session: 'sess-1' }
export const READER: Who = { role: 'reader', actor: 'verifier-cd34', session: 'sess-1' }

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
  kit(who?: Who): Kit
  area(name: string): string
  fail(name: string, on: boolean): void
  git(name: string, ...args: string[]): string
  cleanup(): void
}

export function makeHome(options: { section?: boolean; checks?: boolean } = {}): TestHome {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'kit-eng-')))
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
  const section = options.section === false ? '' : `engineering:
  dir: work
  backlog: backlog
  protected: [main, master]
  areas:
    - { name: bff, path: projects/bff, kind: backend, ${checks ? `${checks}, ` : ''}test: "sh test.sh {files}" }
    - { name: web, path: projects/web, kind: frontend, checks: [sh test.sh], test: "sh test.sh {files}" }
`
  writeFileSync(join(root, 'kit.yml'), `packs: [engineering]\n${section}`)
  mkdirSync(join(root, 'work'), { recursive: true })
  const home = findHome(root)!
  return {
    root,
    home,
    kit: (who = OWNER) => ({ home, db: openDb(dbFile(home)), who }),
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
  return `---\nid: SHOP-1\nkind: ${kind}\nsize: ${options.size ?? 'S'}\nareas: [${(options.areas ?? ['bff']).join(', ')}]\n---\n\n# SHOP-1\n\n## Intent\n\nFix the export date.\n\n## What we will do\n\nShift the date.\n\n## Open points\n\n${tail}\n## Out of scope\n\nNothing.\n`
}

export const PLAN = `# plan\n\n## Architecture\n\nexport.ts line 10 formats the date.\n\n## Design\n\nUse UTC. Not taken: a library.\n\n## Steps\n\n1. the test 2. the fix. Rollback: revert.\n\n## Tests\n\nAC1: a date test and a negative. AC2: an error test and a negative.\n\n## Risks\n\nTime zones.\n`

export const TASKS = (slices: { id: string; area?: string; depends?: string; acs?: string; proof?: string; title?: string }[]) =>
  `# tasks\n\n${slices.map(s => `## ${s.id}: ${s.title ?? `slice ${s.id}`}\n\n- area: ${s.area ?? 'bff'}\n- depends: ${s.depends ?? 'none'}\n- acs: ${s.acs ?? '1, 2'}\n- size: S\n- done when: the test passes\n${s.proof ? `- proof: ${s.proof}\n` : ''}`).join('\n')}`

export const writeDoc = (t: TestHome, id: string, name: string, text: string) => {
  mkdirSync(join(t.root, 'work', id), { recursive: true })
  writeFileSync(join(t.root, 'work', id, name), text)
}

/** An item taken to a state through the real moves, with one slice T1 in bff. */
export function itemAt(t: TestHome, state: 'backlog' | 'framing' | 'planning' | 'ready' | 'cooking' | 'checking', id = 'SHOP-1', spec = SPEC(), tasks = TASKS([{ id: 'T1' }])) {
  const lead = t.kit(LEAD)
  const owner = t.kit(OWNER)
  newItem(lead, { id, title: 'the export date is off', kind: 'feature', size: 'S', areas: ['bff'] })
  if (state === 'backlog') return
  moveItem(lead, 'start', id)
  if (state === 'framing') return
  writeDoc(t, id, 'spec.md', spec.replaceAll('SHOP-1', id))
  moveItem(lead, 'agree', id)
  if (state === 'planning') return
  writeDoc(t, id, 'plan.md', PLAN)
  writeDoc(t, id, 'tasks.md', tasks)
  importTasks(lead, id)
  moveItem(owner, 'approve', id)
  if (state === 'ready') return
  const areas = /areas: \[([^\]]*)\]/.exec(spec)?.[1]?.split(',').map(s => s.trim()) ?? ['bff']
  for (const area of areas) t.git(area, 'switch', '-q', '-c', `kit/${id}-work`)
  moveItem(lead, 'begin', id)
  if (state === 'cooking') return
  throw new Error('itemAt: checking needs the slices done and a verify; do it in the test')
}
