import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'

import { KIT_FILE, STATE_DIR, parseKitConfig, readEnvironment } from '@kit/shared/env.ts'
import { usage } from '@kit/shared/errors.ts'
import { availablePacks } from '@kit/shared/pack.ts'

export const BLOCK_BEGIN = '<!-- kit:begin -->'
export const BLOCK_END = '<!-- kit:end -->'
const RULES_DIR = join('.claude', 'rules', 'kit')
const STYLES_DIR = join('.claude', 'output-styles')

export type InitOptions = { dir: string; packs: string[]; update: boolean; coreDir: string }
export type InitReport = { wrote: string[]; kept: string[]; packs: string[] }

/**
 * Scaffolds the kit in one folder: kit.yml (once), the kit block of CLAUDE.md, the base rules, the kit keys of
 * the settings, the output style, the state folder. It never touches a line that the owner wrote.
 */
export function init(options: InitOptions): InitReport {
  const { dir, update, coreDir } = options
  const report: InitReport = { wrote: [], kept: [], packs: [] }
  const known = availablePacks()
  for (const name of options.packs) {
    if (name === 'core') continue
    if (!known.has(name)) throw usage(`no pack is named "${name}"`, `packs that exist: ${[...known.keys()].join(', ') || 'core'}`)
  }

  // kit.yml: made once; a later init adds the packs that it names, and nothing else
  const kitFile = join(dir, KIT_FILE)
  if (!existsSync(kitFile)) {
    writeFileSync(kitFile, kitYaml(options.packs.filter(p => p !== 'core')))
    report.wrote.push(KIT_FILE)
  } else if (options.packs.length) {
    const current = parseKitConfig(readFileSync(kitFile, 'utf8'), kitFile)
    const missing = options.packs.filter(p => p !== 'core' && !current.packs.includes(p))
    if (missing.length) {
      writeFileSync(kitFile, addPacks(readFileSync(kitFile, 'utf8'), missing))
      report.wrote.push(KIT_FILE)
    } else report.kept.push(KIT_FILE)
  } else report.kept.push(KIT_FILE)
  const env = readEnvironment(dir)
  report.packs = ['core', ...env.config.packs]

  // the state folder
  const state = join(dir, STATE_DIR)
  if (!existsSync(state)) {
    mkdirSync(state, { recursive: true })
    report.wrote.push(`${STATE_DIR}/`)
  }

  // CLAUDE.md: the block only
  const template = readFileSync(join(coreDir, 'templates', 'claude-block.md'), 'utf8').trim()
  const block = template.replace('{{packs}}', report.packs.join(', '))
  const claudeFile = join(dir, 'CLAUDE.md')
  const before = existsSync(claudeFile) ? readFileSync(claudeFile, 'utf8') : ''
  const after = placeBlock(before, block, update)
  if (after !== before) {
    writeFileSync(claudeFile, after)
    report.wrote.push('CLAUDE.md (the kit block)')
  } else report.kept.push('CLAUDE.md')

  // the base rules: one file each, from the core and from each pack that is on; rules turned off are not written
  const rulesDir = join(dir, RULES_DIR)
  mkdirSync(rulesDir, { recursive: true })
  const wanted = new Map<string, string>()
  for (const name of report.packs) {
    const pack = name === 'core' ? { dir: coreDir, manifest: known.get('core')?.manifest } : known.get(name)
    if (!pack?.manifest) continue
    for (const rel of pack.manifest.rules ?? []) {
      const file = join(pack.dir, rel)
      const ruleName = basename(rel, '.md')
      if (env.config.rules.off.includes(ruleName)) continue
      wanted.set(`${ruleName}.md`, readFileSync(file, 'utf8'))
    }
  }
  for (const [file, text] of wanted) {
    const target = join(rulesDir, file)
    if (!existsSync(target) || (update && readFileSync(target, 'utf8') !== text)) {
      writeFileSync(target, text)
      report.wrote.push(`${RULES_DIR}/${file}`)
    }
  }
  // a rule that the kit wrote before and that is off now, or gone from the packs, goes away on update
  if (update) {
    for (const file of readdirSync(rulesDir)) {
      if (!wanted.has(file)) {
        rmSync(join(rulesDir, file))
        report.wrote.push(`${RULES_DIR}/${file} (removed)`)
      }
    }
  }

  // the output style
  const stylesDir = join(dir, STYLES_DIR)
  mkdirSync(stylesDir, { recursive: true })
  const styleSource = join(coreDir, 'templates', 'output-styles', 'kit-companion.md')
  const styleTarget = join(stylesDir, 'kit-companion.md')
  const styleText = readFileSync(styleSource, 'utf8')
  if (!existsSync(styleTarget) || (update && readFileSync(styleTarget, 'utf8') !== styleText)) {
    writeFileSync(styleTarget, styleText)
    report.wrote.push(`${STYLES_DIR}/kit-companion.md`)
  }

  // settings: the kit keys merged; the owner's keys kept
  const settingsFile = join(dir, '.claude', 'settings.json')
  const current = existsSync(settingsFile) ? (JSON.parse(readFileSync(settingsFile, 'utf8')) as Settings) : {}
  let merged = current
  for (const name of report.packs) {
    const pack = name === 'core' ? { dir: coreDir, manifest: known.get('core')?.manifest } : known.get(name)
    if (!pack?.manifest?.settings) continue
    merged = mergeSettings(merged, JSON.parse(readFileSync(join(pack.dir, pack.manifest.settings), 'utf8')) as Settings)
  }
  const mergedText = `${JSON.stringify(merged, null, 2)}\n`
  if (!existsSync(settingsFile) || readFileSync(settingsFile, 'utf8') !== mergedText) {
    writeFileSync(settingsFile, mergedText)
    report.wrote.push('.claude/settings.json (the kit keys)')
  } else report.kept.push('.claude/settings.json')

  return report
}

export type Settings = { permissions?: { allow?: string[]; ask?: string[]; deny?: string[] }; [key: string]: unknown }

/** Lists join, in order, with no doubles. For other keys the kit sets a key only when the owner has none. */
export function mergeSettings(owner: Settings, kit: Settings): Settings {
  const result: Settings = { ...owner }
  if (kit.permissions) {
    const perms = { ...(owner.permissions ?? {}) }
    for (const list of ['allow', 'ask', 'deny'] as const) {
      const have = perms[list] ?? []
      perms[list] = [...have, ...(kit.permissions[list] ?? []).filter(rule => !have.includes(rule))]
    }
    result.permissions = perms
  }
  for (const [key, value] of Object.entries(kit)) {
    if (key === 'permissions') continue
    if (!(key in result)) result[key] = value
  }
  return result
}

/** Puts the block at the end of the file, or replaces the block that is there when `update` is on. */
export function placeBlock(text: string, block: string, update: boolean): string {
  const begin = text.indexOf(BLOCK_BEGIN)
  const end = text.indexOf(BLOCK_END)
  if (begin >= 0 && end > begin) {
    if (!update) return text
    return text.slice(0, begin) + block + text.slice(end + BLOCK_END.length)
  }
  const head = text.trimEnd()
  return head ? `${head}\n\n${block}\n` : `${block}\n`
}

function kitYaml(packs: string[]): string {
  const list = packs.length ? `[${packs.join(', ')}]` : '[]'
  return `# Harness Kit: this folder is an environment. The folders inside it get its packs and its rules.\n# packs: the packs on here, in addition to the ones of the environments above. packs.off turns one off.\n# rules.off: base rules that you do not want written. Each pack reads its own section by its name.\npacks: ${list}\n`
}

/** Adds packs to the `packs:` line of kit.yml without a change to any other line. */
export function addPacks(source: string, missing: string[]): string {
  const lines = source.split('\n')
  const i = lines.findIndex(line => /^packs:\s*\[/.test(line))
  if (i >= 0) {
    const inside = lines[i]!.replace(/^packs:\s*\[/, '').replace(/\].*$/, '').trim()
    const have = inside ? inside.split(',').map(s => s.trim()) : []
    lines[i] = `packs: [${[...have, ...missing].join(', ')}]`
    return lines.join('\n')
  }
  throw usage('kit.yml does not have a `packs: [...]` line', `add the packs by hand: ${missing.join(', ')}`)
}
