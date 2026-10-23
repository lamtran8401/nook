import { describe, expect, test } from 'bun:test'

import { type Tokens, tokensCss, uiKit } from '../src/ui-kit.ts'

const TOKENS: Tokens = {
  color: {
    themes: [{ id: 'light' }, { id: 'dark' }, { id: 'wire' }],
    tokens: [
      { name: 'bg', value: { light: '#fff', dark: '#000', wire: '#eee' } },
      { name: 'fg', value: { light: '#111', dark: '#ddd' } },
      { name: 'focus-ring', value: '{primary}' },
    ],
  },
  type: { families: { sans: '"Be Vietnam Pro", sans-serif' } },
  spacing: { tokens: [{ name: 'space-1', value: '4px' }] },
}

describe('tokensCss', () => {
  test('the first theme goes on :root with the plain tokens and the font families', () => {
    expect(tokensCss(TOKENS).split('\n')[0]).toBe(
      ':root { --bg: #fff; --fg: #111; --focus-ring: var(--primary); --space-1: 4px; --font-sans: "Be Vietnam Pro", sans-serif; }',
    )
  })

  test('the dark theme follows the system setting when the page sets no theme', () => {
    expect(tokensCss(TOKENS).split('\n')[1]).toBe(
      '@media (prefers-color-scheme: dark) { :root:not([data-theme]) { --bg: #000; --fg: #ddd; color-scheme: dark; } }',
    )
  })

  test('each other theme gets its data-theme block with only the tokens it sets', () => {
    expect(tokensCss(TOKENS).split('\n').slice(2)).toEqual([
      '[data-theme="dark"] { --bg: #000; --fg: #ddd; color-scheme: dark; }',
      '[data-theme="wire"] { --bg: #eee; }',
    ])
  })
})

describe('uiKit', () => {
  test('the stylesheet starts with the font import of the bundle, then the tokens', () => {
    const { css } = uiKit()
    expect(css.startsWith('@import url("https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro')).toBe(true)
    expect(css.split('\n').find(line => line.startsWith(':root {'))).toContain('--primary: #2b4de6;')
    expect(css.match(/@import/g)?.length).toBe(1)
  })

  test('the script is the behaviour layer of the nook', () => {
    expect(uiKit().js).toContain('window.Bench = {')
  })
})

describe('the bundle script', () => {
  test('runs to its end while the page loads and gives Bench its diagram library', () => {
    const noop = () => {}
    const node = (): Record<string, unknown> => ({ style: {}, dataset: {}, classList: { add: noop }, setAttribute: noop, appendChild: noop, getContext: () => ({ measureText: () => ({ width: 0 }) }) })
    const document = { readyState: 'loading', addEventListener: noop, createElement: node, createElementNS: node, documentElement: node(), querySelectorAll: () => [] }
    const window: Record<string, unknown> = { addEventListener: noop }
    new Function('window', 'document', uiKit().js)(window, document)
    const bench = window.Bench as { diagram?: { render?: unknown; mount?: unknown } }
    expect(typeof bench.diagram?.render).toBe('function')
    expect(window.BenchDiagrams).toBe(bench.diagram)
  })
})
