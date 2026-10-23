import { describe, expect, test } from 'bun:test'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..', '..', '..')
const read = (...parts: string[]) => readFileSync(join(root, ...parts), 'utf8')
const layer = read('packages', 'ui', 'src', 'styles', 'v2.css')
const bench = read('plugin', 'ui', 'bench', 'bundle.css')

/** The custom properties of the first block that opens with `head`, such as `:root {`. */
function tokens(css: string, head: string): Map<string, string> {
  const start = css.indexOf(head)
  if (start < 0) throw new Error(`no block ${head}`)
  const body = css.slice(start + head.length, css.indexOf('}', start))
  return new Map([...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(m => [m[1]!, m[2]!.trim()]))
}

/** A value with each var() of the same block replaced, such as var(--radius-md) as 12px. */
function resolve(block: Map<string, string>, name: string): string {
  return block.get(name)!.replace(/var\(--([\w-]+)\)/g, (_, inner: string) => resolve(block, inner))
}

/** The text of each file under `dir`, for a search of the tokens that the code reads. */
function sources(dir: string): string {
  return readdirSync(dir)
    .map(name => join(dir, name))
    .map(path => (statSync(path).isDirectory() ? sources(path) : readFileSync(path, 'utf8')))
    .join('\n')
}

/** The selectors of each rule of `css` whose body sets `corner-shape: <shape>`. */
function cornered(css: string, shape: string): string[] {
  const rules = css.replace(/\/\*[\s\S]*?\*\//g, '')
  return [...rules.matchAll(new RegExp(`([^{}]+)\\{[^}]*corner-shape:\\s*${shape}`, 'g'))].flatMap(m => m[1]!.split(',').map(s => s.trim()))
}

const light = tokens(layer, ':root {')
const systemDark = tokens(layer, ':root:not([data-theme="light"]) {')
const chosenDark = tokens(layer, ':root[data-theme="dark"] {')

describe('the v2 layer over the Bench kit', () => {
  test('the ground is the off-white of the owner and a card is white', () => {
    expect(light.get('bg')).toBe('#f6f6f4')
    expect(light.get('surface')).toBe('#ffffff')
  })

  test('each colour of the light theme has a dark value, the same for the system and for a chosen dark theme', () => {
    const colours = [...light].filter(([, value]) => /oklch|#[0-9a-f]{3,8}\b/i.test(value)).map(([name]) => name)
    expect(colours.length).toBeGreaterThan(20)
    for (const name of colours) {
      expect({ name, dark: systemDark.has(name) }).toEqual({ name, dark: true })
      expect({ name, same: systemDark.get(name) === chosenDark.get(name) }).toEqual({ name, same: true })
    }
  })

  test('each token that the layer sets is read by the kit or the web app, so a renamed Bench token fails here', () => {
    const reads = [bench, layer, read('packages', 'ui', 'src', 'styles', 'globals.css'), sources(join(root, 'packages', 'ui', 'src', 'components')), sources(join(root, 'apps', 'web', 'components'))].join('\n')
    const set = new Set([...layer.matchAll(/--([\w-]+):/g)].map(m => m[1]!))
    const unread = [...set].filter(name => !reads.includes(`var(--${name}`))
    expect(unread).toEqual([])
  })

  test('every box that the kit draws with a superellipse gets the round corner', () => {
    const round = new Set(cornered(layer, 'round'))
    const missing = cornered(bench, 'superellipse').filter(selector => !round.has(selector))
    expect(missing).toEqual([])
  })

  test('the box roles of the kit read the v2 scale: a node and a card 12px, a frame 16px', () => {
    expect(resolve(light, 'r-shape')).toBe('12px')
    expect(resolve(light, 'r-board')).toBe('12px')
    expect(resolve(light, 'r-card')).toBe('12px')
    expect(resolve(light, 'r-frame')).toBe('16px')
  })

  test('with reduced transparency each glass turns solid', () => {
    const solid = tokens(layer, '@media (prefers-reduced-transparency: reduce) {\n  :root {')
    expect(solid.get('glass')).toBe('var(--surface)')
    expect(solid.get('glass-strong')).toBe('var(--surface)')
  })
})
