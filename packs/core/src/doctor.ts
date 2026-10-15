import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { basename, join, relative } from 'node:path'

import { activePacks, environmentsAbove, KIT_FILE, STATE_DIR } from '@kit/shared/env.ts'
import { availablePacks } from '@kit/shared/pack.ts'

import { BLOCK_BEGIN, BLOCK_END } from './init.ts'

export type Finding = { level: 'error' | 'warn' | 'ok'; where: string; text: string; fix?: string }
export type DoctorReport = {
  environments: { dir: string; packs: string[]; off: string[] }[]
  packs: { name: string; home: string }[]
  findings: Finding[]
}

/** What the folder gets, and every gap with its fix. */
export function doctor(from: string, coreDir: string): DoctorReport {
  const envs = environmentsAbove(from)
  const known = availablePacks()
  const findings: Finding[] = []
  if (!envs.length) {
    findings.push({ level: 'error', where: from, text: 'not inside an environment: no kit.yml here or above', fix: 'run `kit init` in this folder or in one above it' })
    return { environments: [], packs: [], findings }
  }
  for (const env of envs) {
    const where = env.dir
    for (const name of env.config.packs) {
      if (name !== 'core' && !known.has(name)) findings.push({ level: 'error', where, text: `kit.yml names a pack that does not exist: ${name}`, fix: `remove it, or install a kit that ships "${name}"` })
    }
    const claude = join(env.dir, 'CLAUDE.md')
    const text = existsSync(claude) ? readFileSync(claude, 'utf8') : ''
    if (!text.includes(BLOCK_BEGIN) || !text.includes(BLOCK_END)) findings.push({ level: 'warn', where, text: 'CLAUDE.md has no kit block', fix: `run \`kit init --update\` in ${env.dir}` })
    const rulesDir = join(env.dir, '.claude', 'rules', 'kit')
    if (!existsSync(rulesDir)) findings.push({ level: 'warn', where, text: 'the base rules are missing (.claude/rules/kit/)', fix: `run \`kit init --update\` in ${env.dir}` })
    else {
      // a rule of the owner with the name of a base rule reads as a second voice on the same subject
      const kitRules = new Set(readdirSync(rulesDir).map(f => basename(f, '.md')))
      const ownRules = readdirSync(join(env.dir, '.claude', 'rules')).filter(f => f.endsWith('.md')).map(f => basename(f, '.md'))
      for (const rule of ownRules) {
        if (kitRules.has(rule)) findings.push({ level: 'warn', where, text: `two rules named "${rule}": yours and the kit's; Claude can follow either`, fix: `turn the kit rule off (rules: { off: [${rule}] }) or rename yours` })
      }
    }
    if (!existsSync(join(env.dir, STATE_DIR))) findings.push({ level: 'warn', where, text: `the state folder ${STATE_DIR}/ is missing`, fix: `run \`kit init --update\` in ${env.dir}` })
    const settings = join(env.dir, '.claude', 'settings.json')
    if (!existsSync(settings)) findings.push({ level: 'warn', where, text: '.claude/settings.json is missing: the kit permissions do not apply to a session that starts here', fix: `run \`kit init --update\` in ${env.dir}` })
    for (const secret of env.config.secrets) {
      if (!existsSync(join(env.dir, secret))) findings.push({ level: 'warn', where, text: `a secret of kit.yml does not exist: ${secret}`, fix: 'remove it from `secrets`, or check the path' })
    }
    const toolRules = join(env.dir, '.claude', 'rules')
    const kitFileText = readFileSync(join(env.dir, KIT_FILE), 'utf8')
    if (/^\s*packs:\s*$/m.test(kitFileText)) findings.push({ level: 'warn', where, text: 'kit.yml has an empty `packs:` key', fix: 'write `packs: []` or list the packs' })
    void toolRules
  }
  const packs = activePacks(from).map(p => ({ name: p.name, home: p.home.dir }))
  if (!findings.length) findings.push({ level: 'ok', where: from, text: `${envs.length} environment${envs.length > 1 ? 's' : ''} above, ${packs.length + 1} packs on, no gap` })
  void coreDir
  return { environments: envs.map(e => ({ dir: e.dir, packs: e.config.packs, off: e.config.off })), packs: [{ name: 'core', home: envs[0]!.dir }, ...packs], findings }
}

export function formatDoctor(report: DoctorReport, from: string): string {
  const lines: string[] = []
  if (report.environments.length) {
    lines.push('Environments, the outermost first:')
    for (const env of report.environments) {
      const extra = env.off.length ? `; off: ${env.off.join(', ')}` : ''
      lines.push(`  ${env.dir === from ? '•' : '·'} ${env.dir}  packs: ${['core', ...env.packs].join(', ')}${extra}`)
    }
    lines.push('Packs on here, and where each keeps its record:')
    for (const pack of report.packs) lines.push(`  ${pack.name.padEnd(12)} ${pack.home === from ? 'here' : pack.home}`)
  }
  const gaps = report.findings.filter(f => f.level !== 'ok')
  if (gaps.length) {
    lines.push('Gaps:')
    for (const f of gaps) lines.push(`  ${f.level === 'error' ? '✗' : '!'} ${f.text}${f.fix ? `\n      fix: ${f.fix}` : ''}`)
  } else lines.push(`✓ ${report.findings[0]?.text ?? 'no gap'}`)
  return lines.join('\n')
}
