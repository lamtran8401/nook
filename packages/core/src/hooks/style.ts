import { readFileSync } from 'node:fs'
import { isAbsolute, join, relative, resolve, sep } from 'node:path'

import { nearestEnvironment } from '@kit/env/env.ts'
import { block, type HookInput, type HookResult, pass } from '@kit/shared/hook.ts'

import { score } from '../ste.ts'

/** The folders of the record that the writing check reads, relative to the environment. */
const CHECKED_FOLDERS = ['docs', 'work', 'backlog']
/** Old work: read it, never rewrite it to the standard. */
const SKIPPED = join('docs', 'archive')

function recordPath(input: HookInput): { full: string; rel: string } | null {
  const cwd = input.cwd ?? process.cwd()
  const env = nearestEnvironment(cwd)
  const target = String(input.tool_input?.file_path ?? '')
  if (!env || !target.endsWith('.md')) return null
  const full = resolve(cwd, target)
  const rel = relative(env.dir, full)
  if (!rel || rel.startsWith('..') || isAbsolute(rel)) return null
  if (!CHECKED_FOLDERS.includes(rel.split(sep)[0] ?? '') || rel.startsWith(SKIPPED)) return null
  return { full, rel }
}

/** PostToolUse Edit, Write: a Markdown file of the record passes the writing standard, or its sentences come back. */
export function styleCheck(input: HookInput): HookResult {
  const path = recordPath(input)
  if (!path) return pass
  let text: string
  try {
    text = readFileSync(path.full, 'utf8')
  } catch {
    return pass
  }
  const result = score(text, path.rel)
  if (result.pass) return pass
  const lines = result.failures.slice(0, 8).map(f => `  - ${f.why.join('; ')}: ${f.sentence.slice(0, 110)}`)
  return block(`${path.rel}: ${result.score}% of ${result.sentences} sentences pass the writing standard (needs above 80%). Rewrite these in Simplified Technical English (25 words or fewer; no should, may, might, etc, very, really, extremely):\n${lines.join('\n')}`)
}
