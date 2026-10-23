import { resolve } from 'node:path'

import { arg, list, type Program } from '@nook/shared/cli.ts'
import { activeFeatures, desksAbove, FEATURES, type FeatureModule, nearestDesk, pluginDir, projectRoot } from '@nook/desk/desks.ts'
import { DeskList } from '@nook/desk/desk-list.ts'
import { hookRecorder, readEvents } from '@nook/desk/events.ts'
import { Exit, usage } from '@nook/shared/errors.ts'
import { readInput, runHook } from '@nook/shared/hook.ts'

import { briefSources, collectBrief, formatBrief, startOfYesterday } from './brief/brief.ts'
import { doctor } from './doctor/doctor.ts'
import { blockFacts, errorFacts, eventLines, formatFacts, retroFile, retroSince } from './retro/retro.ts'
import { formatDoctor } from './doctor/format.ts'
import { gateHook } from './hooks/gate.ts'
import { styleCheck } from './hooks/style.ts'
import { CORE_HOOKS, type CoreHook } from './hooks/table.ts'
import { init } from './init/initializer.ts'
import { markdownFiles, scoreFile } from './ste.ts'
import { forgetWeb, pairWeb, startWeb, webDeps } from './web/start.ts'

/** The folders of the brief: the list of the owner, and the desk of `cwd` when the list lacks it. */
const briefDirs = (cwd: string): string[] => {
  const dirs = DeskList.mine().dirs()
  const here = nearestDesk(cwd)?.dir
  return here && !dirs.includes(here) ? [...dirs, here] : dirs
}

/** The desk of the web commands: the nearest one above the folder. */
function webDesk(): string {
  const desk = nearestDesk(process.cwd())
  if (!desk) throw usage('not inside a desk', 'run nook web in a desk, or nook init first')
  return desk.dir
}

/** The commands of the core. `modules` are the feature packages that `nook init` and `nook doctor` reach. */
export const coreProgram = (modules: FeatureModule[] = []): Program => ({
  name: 'nook',
  summary: 'Nook: a base layer for Claude Code that you init into any folder',
  commands: [
    {
      path: ['init'],
      summary: 'make this folder a desk: nook.yml, the nook block of CLAUDE.md, the base rules, the nook settings keys, .nook/',
      usage: '[--with a,b] [--update]',
      flags: { with: { type: 'string', list: true, help: 'a feature to turn on here with an empty section; repeat it, or join names with a comma' }, update: { type: 'boolean', help: 'replace what Nook owns; never a line of yours' } },
      run(c) {
        const report = init({ dir: process.cwd(), with: list(c, 'with'), update: c.flags.update === true, pluginDir: pluginDir(), modules, list: DeskList.mine() })
        c.out(report, r => {
          const lines = [`features on here: ${r.features.join(', ')}`]
          if (r.wrote.length) lines.push(`wrote: ${r.wrote.join(', ')}`)
          if (r.kept.length) lines.push(`kept: ${r.kept.join(', ')}`)
          if (r.unset.length) lines.push(`next: in Claude Code, run /setup: it writes the section of ${r.unset.join(', ')} in nook.yml`)
          else if (r.wrote.includes('nook.yml')) lines.push('next: in Claude Code, run /setup to build the structure, then nook doctor')
          return lines.join('\n')
        })
      },
    },
    {
      path: ['doctor'],
      summary: 'the desks above this folder, the features each one turns on, and every gap with its fix',
      run(c) {
        const from = process.cwd()
        const report = doctor(from, { modules })
        c.out(report, r => formatDoctor(r, from))
        return report.findings.some(f => f.level === 'error') ? Exit.error : Exit.ok
      },
    },
    {
      path: ['web'],
      summary: 'the desk in the browser: builds the web app when the Nook code changed, then serves it on 127.0.0.1 until Ctrl-C',
      usage: '[--build]',
      flags: { build: { type: 'boolean', help: 'build again, even with no change of the code' } },
      async run(c) {
        const desk = webDesk()
        return startWeb(desk, c.flags.build === true, webDeps(projectRoot(), desk))
      },
    },
    {
      path: ['web', 'pair'],
      summary: 'prints a one-time link that pairs one more browser with the web app that runs, so its owner moves run',
      run() {
        return pairWeb(webDeps(projectRoot(), webDesk()))
      },
    },
    {
      path: ['web', 'forget'],
      summary: 'removes each paired browser of the web app; the pages stay free to read',
      run() {
        return forgetWeb(webDeps(projectRoot(), webDesk()))
      },
    },
    {
      path: ['features'],
      summary: 'the features on in this folder and where each keeps its record; a feature is on where nook.yml has its section',
      run(c) {
        const on = activeFeatures(process.cwd()).map(f => ({ name: f.name, home: f.home.dir }))
        const off = FEATURES.filter(f => !on.some(o => o.name === f.name)).map(f => f.name)
        c.out({ on, off }, r => [
          'on here:',
          ...r.on.map(f => `  ${f.name.padEnd(14)} ${f.home}`),
          ...(r.off.length ? ['off here (add the section to nook.yml):', ...r.off.map(name => `  ${name}`)] : []),
        ].join('\n'))
      },
    },
    {
      path: ['brief'],
      summary: 'what waits for you, what is done since yesterday and what runs, in every folder that you init',
      run(c) {
        const folders = collectBrief(briefDirs(process.cwd()), startOfYesterday(), briefSources(modules))
        c.out({ folders }, r => formatBrief(r.folders))
      },
    },
    {
      path: ['events'],
      summary: 'the event log of this desk: each block of a guard, each error of a hook and each prompt of the owner, oldest first',
      usage: '[--kind block|error|prompt] [--since <date>]',
      flags: { kind: { type: 'string', help: 'block, error or prompt' }, since: { type: 'string', help: 'a date or a time, such as 2026-10-01' } },
      run(c) {
        const desk = nearestDesk(process.cwd())
        if (!desk) throw usage('not inside a desk', 'run nook init in a folder first')
        const kind = c.flags.kind
        if (kind !== undefined && kind !== 'block' && kind !== 'error' && kind !== 'prompt') throw usage('--kind is block, error or prompt')
        const since = typeof c.flags.since === 'string' ? new Date(c.flags.since) : undefined
        if (since && Number.isNaN(since.getTime())) throw usage(`--since is not a date: ${c.flags.since}`, 'write it as 2026-10-01 or 2026-10-01T09:00')
        const events = readEvents(desk.dir, { ...(kind ? { kind } : {}), ...(since ? { since } : {}) })
        c.out(events, all => (all.length ? eventLines(all) : 'no event in the log'))
      },
    },
    {
      path: ['retro'],
      summary: 'the facts since the last retro of this desk: items sent back, guesses flipped, slow questions, weak proofs',
      run(c) {
        const desk = nearestDesk(process.cwd())
        if (!desk) throw usage('not inside a desk', 'run nook init in a folder first')
        const since = retroSince(desk.dir)
        const facts = activeFeatures(desk.dir)
          .filter(f => f.home.dir === desk.dir)
          .flatMap(f => modules.find(m => m.name === f.name)?.retro?.(desk.dir, since) ?? [])
          .concat(blockFacts(readEvents(desk.dir, { kind: 'block', since })), errorFacts(readEvents(desk.dir, { kind: 'error', since })))
        const file = retroFile(desk.dir)
        c.out({ desk: desk.dir, since: since.toISOString(), file, facts }, r =>
          [`since ${r.since}; the file of today: ${r.file.path}${r.file.exists ? ' (exists)' : ''}`, '', formatFacts(r.facts)].join('\n'),
        )
      },
    },
    {
      path: ['where'],
      summary: 'the desks above this folder and the nook project',
      run(c) {
        const desks = desksAbove(process.cwd())
        c.out({ desks: desks.map(d => d.dir), project: projectRoot() }, r => [...r.desks.map(d => `desk: ${d}`), `project: ${r.project}`].join('\n'))
      },
    },
    {
      path: ['ste'],
      summary: 'score Markdown files against the writing standard (Simplified Technical English)',
      usage: '<file|folder...> [--min N] [--quiet]',
      flags: { min: { type: 'string', help: 'the score to pass, default 80' }, quiet: { type: 'boolean', help: 'no failing sentences' } },
      run(c) {
        const minimum = c.flags.min ? Number(c.flags.min) : 80
        const files = c.args.flatMap(p => markdownFiles(resolve(p)))
        if (!files.length) {
          arg(c, 0, 'file or folder')
          return Exit.usage
        }
        const results = files.map(f => scoreFile(f, minimum))
        c.out(results, rs => rs.map(r => {
          const head = `${r.file}: ${r.score}% of ${r.sentences} sentences (${r.pass ? 'ok' : 'FAIL'}, needs above ${minimum}%)`
          if (r.pass || c.flags.quiet) return head
          return [head, ...r.failures.slice(0, 8).map(f => `  - ${f.why.join('; ')}: ${f.sentence.slice(0, 110)}`)].join('\n')
        }).join('\n'))
        return results.every(r => r.pass) ? Exit.ok : Exit.error
      },
    },
    {
      path: ['hook'],
      summary: 'run one hook of the core with the Claude Code event on stdin (read, bash, edit, style, start, gate)',
      usage: '<name>',
      async run(c) {
        const name = arg(c, 0, 'hook name')
        const hooks: Record<string, CoreHook> = {
          ...CORE_HOOKS,
          gate: { handler: input => gateHook(input, { modules }), closed: true },
          style: { handler: input => styleCheck(input, { modules }), closed: false },
        }
        const hook = hooks[name]
        if (!hook) {
          c.say(`no hook is named ${name}`)
          return Exit.usage
        }
        const input = await readInput()
        return runHook(() => hook.handler(input), hook.closed, hookRecorder(input, `core ${name}`))
      },
    },
  ],
})
