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
  if (report.workspaces.length) {
    lines.push('Workspaces, the outermost first:')
    for (const workspace of report.workspaces) lines.push(`  ${workspace.dir === from ? '•' : '·'} ${workspace.dir}  sections: ${workspace.features.join(', ') || 'none'}`)
    lines.push('Features on here, and where each keeps its record:')
    for (const feature of report.features) lines.push(`  ${feature.name.padEnd(14)} ${feature.home === from ? 'here' : feature.home}`)
  }
  const gaps = report.findings.filter(f => f.level !== 'ok')
  if (!gaps.length) return [...lines, `✓ ${report.findings[0]?.text ?? 'no gap'}`].join('\n')
  lines.push('Gaps:')
  for (const f of gaps) lines.push(`  ${mark(f.level)} ${f.text}${f.fix ? `\n      fix: ${f.fix}` : ''}`)
  return lines.join('\n')
}
