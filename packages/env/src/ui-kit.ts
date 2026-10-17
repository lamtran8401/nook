import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { Catalog } from './catalog.ts'

/**
 * The UI kit of the pages that the nook builds: the tokens and the `bn-*` components of Bench, kept as files in
 * `plugins/core/ui/bench/`. A page inlines what this module returns, since an artifact loads no other stylesheet.
 */

type Themed = string | Record<string, string>
type Token = { name: string; value: Themed }
export type Tokens = {
  color: { themes: { id: string }[]; tokens: Token[] }
  type: { families: Record<string, string> }
  [family: string]: unknown
}

export type UiKit = { css: string; js: string }

const DIR = ['ui', 'bench']

/** `{primary}` names another token. */
const valueOf = (value: string) => value.replace(/^\{([\w.-]+)\}$/, 'var(--$1)')

const themeValue = (value: Themed, theme: string, first: string): string | undefined =>
  typeof value === 'string' ? (theme === first ? value : undefined) : value[theme]

/** The CSS variables of the tokens: the first theme on :root, the dark theme for the system setting too, each theme on its data-theme. */
export function tokensCss(tokens: Tokens): string {
  const themes = tokens.color.themes.map(t => t.id)
  const first = themes[0]!
  const families = Object.entries(tokens).filter(([key, f]) => key !== 'color' && key !== 'type' && Array.isArray((f as { tokens?: unknown }).tokens))
  const all: Token[] = [...tokens.color.tokens, ...families.flatMap(([, f]) => (f as { tokens: Token[] }).tokens)]
  const block = (theme: string) =>
    all
      .map(t => [t.name, themeValue(t.value, theme, first)] as const)
      .filter(([, v]) => v !== undefined)
      .map(([name, v]) => `--${name}: ${valueOf(v!)};`)
      .join(' ')
  const fonts = Object.entries(tokens.type.families).map(([name, stack]) => `--font-${name}: ${stack};`).join(' ')
  const lines = [`:root { ${block(first)} ${fonts} }`]
  if (themes.includes('dark')) lines.push(`@media (prefers-color-scheme: dark) { :root:not([data-theme]) { ${block('dark')} color-scheme: dark; } }`)
  for (const theme of themes.slice(1)) lines.push(`[data-theme="${theme}"] { ${block(theme)}${theme === 'dark' ? ' color-scheme: dark;' : ''} }`)
  return lines.join('\n')
}

let cached: UiKit | null = null

/** The tokens as CSS, the component styles and the behaviour script of the UI kit. */
export function uiKit(catalog = Catalog.load()): UiKit {
  if (cached) return cached
  const dir = join(catalog.dirOf('core'), ...DIR)
  const tokens = JSON.parse(readFileSync(join(dir, 'tokens.json'), 'utf8')) as Tokens
  // the fonts come from the @import of the bundle, which must stay the first rule of the sheet
  const bundle = readFileSync(join(dir, 'bundle.css'), 'utf8')
  const importLine = /^@import\s+url\([^)]*\)[^;]*;\s*/.exec(bundle)?.[0] ?? ''
  cached = { css: `${importLine}${tokensCss(tokens)}\n${bundle.slice(importLine.length)}`, js: readFileSync(join(dir, 'bundle.js'), 'utf8') }
  return cached
}
