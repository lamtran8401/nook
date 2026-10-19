import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { runInNewContext } from 'node:vm'

import { Catalog } from '../src/catalog.ts'

type Fake = { innerHTML: string; children: Fake[] }

/** A DOM element that takes any call and keeps the HTML written into it and its children. */
function fakeElement(): Fake {
  const own: Fake = { innerHTML: '', children: [] }
  const stored = new Map<string | symbol, unknown>()
  const handler: ProxyHandler<Fake> = {
    get(target, name) {
      if (name in target) return target[name as keyof Fake]
      if (stored.has(name)) return stored.get(name)
      if (typeof name === 'string' && name.startsWith('_')) return undefined
      if (name === 'appendChild') return (child: Fake) => (target.children.push(child), child)
      if (name === 'clientWidth') return 900
      if (name === 'style') return { setProperty() {} }
      if (name === 'classList') return { add() {}, toggle() {}, remove() {}, contains: () => false }
      if (name === 'querySelectorAll') return () => []
      if (name === 'querySelector' || name === 'getAttribute' || name === 'closest') return () => null
      return () => undefined
    },
    set(target, name, value) {
      if (name === 'innerHTML') target.innerHTML = value
      else stored.set(name, value)
      return true
    },
  }
  return new Proxy(own, handler)
}

/** The HTML that the Bench bundle writes for one board spec. */
function boardHtml(spec: object): string {
  const js = readFileSync(join(Catalog.load().dirOf('core'), 'ui', 'bench', 'bundle.js'), 'utf8')
  const document = { readyState: 'complete', querySelectorAll: () => [], addEventListener() {}, createElement: fakeElement, documentElement: { dataset: {}, setAttribute() {}, getAttribute: () => null }, body: fakeElement() }
  const sandbox: Record<string, unknown> = {
    document, console, localStorage: { getItem: () => null, setItem() {} }, matchMedia: () => ({ matches: false, addEventListener() {} }),
    getComputedStyle: () => ({ paddingLeft: '0', paddingRight: '0', getPropertyValue: () => '' }), ResizeObserver: class { observe() {} disconnect() {} }, requestAnimationFrame: () => 0,
    addEventListener() {}, removeEventListener() {}, setTimeout: () => 0, clearTimeout() {},
  }
  sandbox.window = sandbox
  runInNewContext(js, sandbox)
  const el = fakeElement()
  ;(sandbox.BenchDiagrams as { render: (el: Fake, spec: object) => void }).render(el, spec)
  const all = (node: Fake): string => node.innerHTML + node.children.map(all).join('')
  return all(el)
}

describe('the Bench board', () => {
  test('a card with an href is a link to it; a card with none stays an article', () => {
    const html = boardHtml({ type: 'board', columns: [{ title: 'Cooking', tone: 'primary', cards: [{ id: 'SHOP-12', title: 'Filter shipments', href: '/works/SHOP-12' }, { id: 'SHOP-13', title: 'Export the list' }] }] })
    expect(html).toContain('<a class="bd-card" href="/works/SHOP-12"><div class="bd-top"><span class="bd-id">SHOP-12</span>')
    expect(html).toContain('<article class="bd-card"><div class="bd-top"><span class="bd-id">SHOP-13</span>')
  })

  test('an href keeps its flag, and the address is escaped', () => {
    const html = boardHtml({ type: 'board', columns: [{ title: 'Cooking', cards: [{ id: 'SHOP-14', title: 'x', flag: 'fail', href: '/works/SHOP-14?a=1&b="2"' }] }] })
    expect(html).toContain('<a class="bd-card" href="/works/SHOP-14?a=1&amp;b=&quot;2&quot;" data-flag="fail">')
  })
})
