import { match } from 'ts-pattern'

import type { DoctorReport, Finding } from './doctor.ts'

const mark = (level: Finding['level']) =>
  match(level)
    .with('error', () => '✗')
    .with('warn', () => '!')
    .with('ok', () => '✓')
    .exhaustive()

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
  if (!gaps.length) return [...lines, `✓ ${report.findings[0]?.text ?? 'no gap'}`].join('\n')
  lines.push('Gaps:')
  for (const f of gaps) lines.push(`  ${mark(f.level)} ${f.text}${f.fix ? `\n      fix: ${f.fix}` : ''}`)
  return lines.join('\n')
}
