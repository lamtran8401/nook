import { readFileSync } from 'node:fs'
import { isAbsolute, join, relative, resolve, sep } from 'node:path'

import { nearestDesk, type FeatureModule } from '@nook/desk/desks.ts'
import { block, type HookInput, type HookResult, pass } from '@nook/shared/hook.ts'

import { score } from '../ste.ts'
import { benchFaults, benchReport } from './bench.ts'

export type StyleDeps = { modules: FeatureModule[] }

/** Old work: read it, never rewrite it to the standard. */
const SKIPPED = join('docs', 'archive')

/** The folders of the record: `docs/` of the desk, and the folders that each feature names as its record. */
const recordFolders = (deskDir: string, modules: FeatureModule[]): string[] => [
  join(deskDir, 'docs'),
  ...modules.flatMap(module => module.records?.(deskDir) ?? []),
]

const inside = (folder: string, file: string) => {
  const rel = relative(folder, file)
  return rel !== '' && !rel.startsWith('..') && !isAbsolute(rel)
}

function recordPath(input: HookInput, modules: FeatureModule[]): { full: string; rel: string } | null {
  const cwd = input.cwd ?? process.cwd()
  const desk = nearestDesk(cwd)
  const target = String(input.tool_input?.file_path ?? '')
  if (!desk || !target.endsWith('.md')) return null
  const full = resolve(cwd, target)
  const rel = relative(desk.dir, full)
  if (!recordFolders(desk.dir, modules).some(folder => inside(folder, full)) || rel.startsWith(SKIPPED + sep)) return null
  return { full, rel }
}

/** PostToolUse Edit, Write: a Markdown file of the record passes the writing standard and each of its bench blocks draws, or the faults come back. */
export function styleCheck(input: HookInput, deps: StyleDeps = { modules: [] }): HookResult {
  const path = recordPath(input, deps.modules)
  if (!path) return pass
  let text: string
  try {
    text = readFileSync(path.full, 'utf8')
  } catch {
    return pass
  }
  const faults = benchFaults(text)
  const reports = [writingReport(text, path.rel), faults.length ? benchReport(path.rel, faults) : null].filter(report => report !== null)
  return reports.length ? block(reports.join('\n\n')) : pass
}

function writingReport(text: string, rel: string): string | null {
  const result = score(text, rel)
  if (result.pass) return null
  const lines = result.failures.slice(0, 8).map(f => `  - ${f.why.join('; ')}: ${f.sentence.slice(0, 110)}`)
  return `${rel}: ${result.score}% of ${result.sentences} sentences pass the writing standard (needs above 80%). Rewrite these in Simplified Technical English (25 words or fewer; no should, may, might, etc, very, really, extremely):\n${lines.join('\n')}`
}
