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
  if (report.desks.length) {
    lines.push('Desks, the outermost first:')
    for (const desk of report.desks) {
      const extra = desk.off.length ? `; off: ${desk.off.join(', ')}` : ''
      lines.push(`  ${desk.dir === from ? '•' : '·'} ${desk.dir}  packs: ${['core', ...desk.packs].join(', ')}${extra}`)
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
