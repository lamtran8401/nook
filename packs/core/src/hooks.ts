import { readFileSync } from 'node:fs'
import { basename, isAbsolute, join, relative, resolve, sep } from 'node:path'

import { activePacks, nearestEnvironment, secretsAbove } from '@kit/shared/env.ts'
import { block, context, type HookInput, type HookResult, pass } from '@kit/shared/hook.ts'

import { score } from './ste.ts'

/** The hooks of the core. Each one finds the nearest environment first; outside one, it does nothing. */

const SECRET_NAMES = [/^\.env(\..+)?$/, /^\.npmrc$/]
const SECRET_DIRS = ['.ssh', '.aws']

export function isSecretPath(path: string, cwd: string): boolean {
  const name = basename(path)
  if (name === '.env.example') return false
  if (SECRET_NAMES.some(re => re.test(name))) return true
  const full = resolve(cwd, path.replace(/^~(?=\/|$)/, process.env.HOME ?? '~'))
  const parts = full.split(sep)
  if (SECRET_DIRS.some(dir => parts.includes(dir))) return true
  return secretsAbove(cwd).some(secret => full === secret || full.startsWith(`${secret}${sep}`))
}

/** PreToolUse Read, Grep, Glob: no secret reaches the model. */
export function readGuard(input: HookInput): HookResult {
  const cwd = input.cwd ?? process.cwd()
  if (!nearestEnvironment(cwd)) return pass
  const target = String(input.tool_input?.file_path ?? input.tool_input?.path ?? '')
  if (!target) return pass
  if (isSecretPath(target, cwd)) return block(`${target} is a secret file: the kit does not read secrets. Ask the owner for the value you need, or use .env.example.`)
  return pass
}

/** The words that the shell runs: heredoc bodies and comments are text, not commands. */
export function commandOnly(command: string): string {
  const lines = command.split('\n')
  const kept: string[] = []
  let end: string | null = null
  for (const line of lines) {
    if (end !== null) {
      if (line.trim() === end) end = null
      continue
    }
    const here = line.match(/<<-?\s*['"]?([A-Za-z_][\w-]*)['"]?/)
    kept.push(line.replace(/(^|\s)#.*$/, ''))
    if (here) end = here[1] ?? null
  }
  return kept.join('\n')
}

/** PreToolUse Bash: no secret, no state database, no shell around the kit tool. */
export function bashGuard(input: HookInput): HookResult {
  const cwd = input.cwd ?? process.cwd()
  if (!nearestEnvironment(cwd)) return pass
  const command = String(input.tool_input?.command ?? '')
  const plain = commandOnly(command).replace(/["'\\]/g, '')
  const words = plain.split(/[\s;|&<>()]+/).filter(Boolean)
  for (const word of words) {
    if (/^[~.\/\w-]*\/?\.env(\..+)?$/.test(word) && !word.endsWith('.env.example')) return block(`the command names ${word}: the kit does not read or write secrets.`)
    if (/(^|\/)\.npmrc$/.test(word) || /(^|\/)\.(ssh|aws)(\/|$)/.test(word)) return block(`the command touches ${word}: the kit does not read secrets.`)
    if (/(^|\/)\.kit\/.*\.db/.test(word) || /^sqlite3?$/.test(word)) return block('the state databases of the kit are not for the shell: use the kit tools.')
  }
  for (const secret of secretsAbove(cwd)) {
    const rel = relative(cwd, secret)
    if (plain.includes(secret) || (rel && !rel.startsWith('..') && plain.includes(rel))) return block(`the command names ${rel || secret}, a secret of kit.yml.`)
  }
  if (/\bKIT_ROLE\s*=/.test(plain) || /env\s+-u\s+CLAUDECODE/.test(plain)) return block('the role of an agent is set by the kit, not by a command.')
  return pass
}

/** PreToolUse Edit, Write: no secret file, no state folder, no settings. */
export function editGuard(input: HookInput): HookResult {
  const cwd = input.cwd ?? process.cwd()
  if (!nearestEnvironment(cwd)) return pass
  const target = String(input.tool_input?.file_path ?? '')
  if (!target) return pass
  const full = resolve(cwd, target)
  const name = basename(full)
  if (/^\.env(\..+)?$/.test(name)) return block(`${target} is a secret file: the kit never writes one.`)
  if (full.split(sep).includes('.kit')) return block(`${target} is in the state folder: the kit tools write it, not an edit.`)
  if (/^settings(\.local)?\.json$/.test(name) && full.split(sep).includes('.claude')) return block(`${target} holds the permissions: the owner edits it, or \`kit init --update\`.`)
  return pass
}

const CHECKED_FOLDERS = ['docs', 'work', 'backlog']

/** PostToolUse Edit, Write: a Markdown file of the record passes the writing standard, or the sentences come back. */
export function styleCheck(input: HookInput): HookResult {
  const cwd = input.cwd ?? process.cwd()
  const env = nearestEnvironment(cwd)
  if (!env) return pass
  const target = String(input.tool_input?.file_path ?? '')
  if (!target.endsWith('.md')) return pass
  const full = resolve(cwd, target)
  const rel = relative(env.dir, full)
  if (!rel || rel.startsWith('..') || isAbsolute(rel)) return pass
  const top = rel.split(sep)[0] ?? ''
  if (!CHECKED_FOLDERS.includes(top)) return pass
  // the archive is old work: read it, never rewrite it to the standard
  if (rel.startsWith(join('docs', 'archive'))) return pass
  let text: string
  try {
    text = readFileSync(full, 'utf8')
  } catch {
    return pass
  }
  const result = score(text, rel)
  if (result.pass) return pass
  const lines = result.failures.slice(0, 8).map(f => `  - ${f.why.join('; ')}: ${f.sentence.slice(0, 110)}`)
  return block(`${rel}: ${result.score}% of ${result.sentences} sentences pass the writing standard (needs above 80%). Rewrite these in Simplified Technical English (25 words or fewer; no should, may, might, etc, very, really, extremely):\n${lines.join('\n')}`)
}

/** SessionStart: a few facts about the environment. */
export function sessionStart(input: HookInput): HookResult {
  const cwd = input.cwd ?? process.cwd()
  const env = nearestEnvironment(cwd)
  if (!env) return pass
  const packs = ['core', ...activePacks(cwd).map(p => p.name)]
  return context('SessionStart', `Harness Kit environment: ${env.dir}. Packs on: ${packs.join(', ')}. The base rules are in .claude/rules/kit/. Run \`kit doctor\` for the environments above and every gap.`)
}
