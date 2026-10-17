import { existsSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

import { NOOK_FILE, STATE_DIR } from '@nook/env/env.ts'
import { usage } from '@nook/shared/errors.ts'

import { BLOCK_BEGIN, BLOCK_END } from './claude-block.ts'
import type { Settings } from './settings.ts'

/** The names of an environment from before the tool was named nook. */
const OLD = {
  file: 'kit.yml',
  state: '.kit',
  rules: join('.claude', 'rules', 'kit'),
  style: join('.claude', 'output-styles', 'kit-companion.md'),
  begin: '<!-- kit:begin -->',
  end: '<!-- kit:end -->',
  outputStyle: 'kit-companion',
}
const SETTINGS_FILE = join('.claude', 'settings.json')
const LISTS = ['allow', 'ask', 'deny'] as const

/** The folders from `from` up that hold an environment of the old name: a kit.yml and no nook.yml. */
export function oldEnvironmentsAbove(from: string): string[] {
  const found: string[] = []
  for (let dir = resolve(from); ; dir = dirname(dir)) {
    if (existsSync(join(dir, OLD.file)) && !existsSync(join(dir, NOOK_FILE))) found.push(dir)
    if (dirname(dir) === dir) break
  }
  return found.reverse()
}

/** Moves an environment of the old name to the new names, and returns one line for each change. */
export function moveOldNames(dir: string): string[] {
  const moves = [
    { from: OLD.file, to: NOOK_FILE },
    { from: OLD.state, to: STATE_DIR },
  ]
  for (const { from, to } of moves) {
    if (existsSync(join(dir, from)) && existsSync(join(dir, to)))
      throw usage(`both ${from} and ${to} are in ${dir}`, `keep one: move what you need from ${from} into ${to}, then remove ${from}`)
  }
  const done: string[] = []
  for (const { from, to } of moves) {
    if (!existsSync(join(dir, from))) continue
    renameSync(join(dir, from), join(dir, to))
    done.push(from === OLD.state ? `${from}/ → ${to}/` : `${from} → ${to}`)
  }
  for (const old of [OLD.rules, OLD.style]) {
    if (!existsSync(join(dir, old))) continue
    rmSync(join(dir, old), { recursive: true })
    done.push(old === OLD.rules ? `${old}/ (removed)` : `${old} (removed)`)
  }
  if (renameMarkers(join(dir, 'CLAUDE.md'))) done.push('CLAUDE.md (the block markers)')
  if (renameSettings(join(dir, SETTINGS_FILE))) done.push(`${SETTINGS_FILE} (kit → nook)`)
  return done
}

function renameMarkers(file: string): boolean {
  if (!existsSync(file)) return false
  const text = readFileSync(file, 'utf8')
  if (!text.includes(OLD.begin)) return false
  writeFileSync(file, text.replace(OLD.begin, BLOCK_BEGIN).replace(OLD.end, BLOCK_END))
  return true
}

/** The old name in a permission rule, `Bash(kit eng *)` or `Edit(.kit/**)`, becomes nook; a rule of the owner stays as it is. */
function renameSettings(file: string): boolean {
  if (!existsSync(file)) return false
  const text = readFileSync(file, 'utf8')
  const settings = JSON.parse(text) as Settings
  if (settings.outputStyle === OLD.outputStyle) settings.outputStyle = 'nook-companion'
  const permissions = settings.permissions ?? {}
  for (const list of LISTS) {
    if (permissions[list]) permissions[list] = [...new Set(permissions[list].map(renameRule))]
  }
  const after = `${JSON.stringify(settings, null, 2)}\n`
  if (after === text) return false
  writeFileSync(file, after)
  return true
}

const renameRule = (rule: string): string => rule.replace(/(?<![\w-])kit(?![\w-])/g, 'nook')
