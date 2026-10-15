import { resolve } from 'node:path'

import { arg, list, type Program } from '@kit/shared/cli.ts'
import { activePacks, environmentsAbove, projectRoot } from '@kit/env/env.ts'
import { Exit } from '@kit/shared/errors.ts'
import { readInput, runHook } from '@kit/shared/hook.ts'
import { availablePacks, pluginDir } from '@kit/env/pack.ts'

import { doctor, formatDoctor } from './doctor.ts'
import { bashGuard, editGuard, readGuard, sessionStart, styleCheck } from './hooks.ts'
import { init } from './init.ts'
import { markdownFiles, scoreFile } from './ste.ts'

const coreDir = () => pluginDir('core')

export const coreProgram: Program = {
  name: 'kit',
  summary: 'Harness Kit: a base layer for Claude Code that you init into any folder',
  commands: [
    {
      path: ['init'],
      summary: 'make this folder an environment: kit.yml, the kit block of CLAUDE.md, the base rules, the kit settings keys, .kit/',
      usage: '[--pack a,b] [--update]',
      flags: { pack: { type: 'string', list: true, help: 'a pack to turn on here; repeat it, or join names with a comma' }, update: { type: 'boolean', help: 'replace what the kit owns; never a line of yours' } },
      run(c) {
        const report = init({ dir: process.cwd(), packs: list(c, 'pack'), update: c.flags.update === true, coreDir: coreDir() })
        c.out(report, r => {
          const lines = [`packs on here: ${r.packs.join(', ')}`]
          if (r.wrote.length) lines.push(`wrote: ${r.wrote.join(', ')}`)
          if (r.kept.length) lines.push(`kept: ${r.kept.join(', ')}`)
          if (r.wrote.includes('kit.yml')) lines.push('next: in Claude Code, run /setup to build the structure, then kit doctor')
          return lines.join('\n')
        })
      },
    },
    {
      path: ['doctor'],
      summary: 'the environments above this folder, the packs each one gives, and every gap with its fix',
      run(c) {
        const from = process.cwd()
        const report = doctor(from, coreDir())
        c.out(report, r => formatDoctor(r, from))
        return report.findings.some(f => f.level === 'error') ? Exit.error : Exit.ok
      },
    },
    {
      path: ['packs'],
      summary: 'the packs on in this folder, where each keeps its record, and the packs that the kit ships',
      run(c) {
        const on = activePacks(process.cwd())
        const shipped = [...availablePacks().values()].map(p => ({ name: p.manifest.name, description: p.manifest.description }))
        c.out({ on, shipped }, () => [
          'on here:',
          '  core         (every environment)',
          ...on.map(p => `  ${p.name.padEnd(12)} ${p.home.dir}`),
          'shipped by this kit:',
          ...shipped.map(p => `  ${p.name.padEnd(12)} ${p.description}`),
        ].join('\n'))
      },
    },
    {
      path: ['where'],
      summary: 'the environments above this folder and the kit project',
      run(c) {
        const envs = environmentsAbove(process.cwd())
        c.out({ environments: envs.map(e => e.dir), project: projectRoot() }, r => [...r.environments.map(d => `env: ${d}`), `project: ${r.project}`].join('\n'))
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
      summary: 'run one hook of the core with the Claude Code event on stdin (read, bash, edit, style, start)',
      usage: '<name>',
      async run(c) {
        const name = arg(c, 0, 'hook name')
        const input = await readInput()
        const guards = { read: readGuard, bash: bashGuard, edit: editGuard } as const
        if (name in guards) return runHook(() => guards[name as keyof typeof guards](input), true)
        if (name === 'style') return runHook(() => styleCheck(input), false)
        if (name === 'start') return runHook(() => sessionStart(input), false)
        c.say(`no hook is named ${name}`)
        return Exit.usage
      },
    },
  ],
}
