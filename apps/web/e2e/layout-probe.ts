import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { uiKit } from '@nook/workspace/ui-kit.ts'
import { runCommand } from '@nook/shared/run.ts'

export type Diagram = { name: string; spec: object }

const CHROMES = ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium']

/** The Chrome of the browser checks: NOOK_CHROME, else the usual place on macOS or Linux. */
export function chromePath(): string {
  const chrome = process.env.NOOK_CHROME ?? CHROMES.find(path => existsSync(path))
  if (!chrome) throw new Error(`the layout check needs Google Chrome; set NOOK_CHROME to its path. Looked in: ${CHROMES.join(', ')}`)
  return chrome
}

const esc = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const specJson = (spec: object) => JSON.stringify(spec).replace(/</g, '\\u003c')

/** One page with each diagram in its own section, the Bench kit, and the probe that writes the faults into the page. */
function probePage(diagrams: Diagram[]): string {
  const kit = uiKit()
  const sections = diagrams.map(d => `<section class="case" data-name="${esc(d.name)}"><div data-bn-diagram><script type="application/json">${specJson(d.spec)}</script></div></section>`)
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Layout check</title>
<style>${kit.css}\nbody { margin: 0; background: var(--bg); } .case { width: 880px; margin: 24px; }</style>
<script>window.nookErrors = []; addEventListener('error', e => nookErrors.push(e.message))</script>
<script>${kit.js}</script></head><body>
${sections.join('\n')}
<script>(${probe.toString()})()</script></body></html>`
}

/** Draws each diagram in headless Chrome and returns each fault of its layout, named by the diagram. */
export function layoutFaults(diagrams: Diagram[], chrome = chromePath()): string[] {
  const dir = mkdtempSync(join(tmpdir(), 'nook-layout-'))
  try {
    const page = join(dir, 'page.html')
    writeFileSync(page, probePage(diagrams))
    const flags = ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', `--user-data-dir=${join(dir, 'profile')}`, '--window-size=1440,4000', '--virtual-time-budget=20000', '--dump-dom']
    const run = runCommand([chrome, ...flags, `file://${page}`], { timeoutMs: 180_000 })
    const found = /<pre id="nook-probe">([^<]*)<\/pre>/.exec(run.out)
    if (!found) throw new Error(`Chrome wrote no probe result (exit ${run.code}): ${run.err.trim().split('\n').slice(-3).join(' ')}`)
    return JSON.parse(decodeURIComponent(found[1]!)) as string[]
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

/**
 * Runs in the page once the fonts arrive: for each drawn diagram it looks for an edge through a node, two labels under 6 px
 * apart, a label on another edge or on a node, and an edge that leaves or enters its node backwards.
 */
export function probe(): void {
  const faults: string[] = []
  const FONTS = ['Be Vietnam Pro', 'JetBrains Mono']
  const overlap = (a: DOMRect, b: DOMRect) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
  // the points of a path on the screen, every `step` px along it
  const points = (path: SVGPathElement, step: number) => {
    const m = path.getScreenCTM()!
    const length = path.getTotalLength()
    const out: { x: number; y: number }[] = []
    for (let d = 0; d <= length; d += step) {
      const q = path.getPointAtLength(d)
      out.push({ x: m.a * q.x + m.c * q.y + m.e, y: m.b * q.x + m.d * q.y + m.f })
    }
    return out
  }
  const ends = (path: SVGPathElement) => [path.getPointAtLength(0), path.getPointAtLength(path.getTotalLength())] as const
  const near = (p: DOMPoint, q: DOMPoint) => Math.hypot(p.x - q.x, p.y - q.y) < 2
  const inside = (p: { x: number; y: number }, r: DOMRect, inset: number) => p.x > r.left + inset && p.x < r.right - inset && p.y > r.top + inset && p.y < r.bottom - inset

  type Node = { id: string; r: DOMRect }
  type Edge = { from: string; to: string; path: SVGPathElement }
  type Fault = (text: string) => void

  function edgeFaults(edges: Edge[], nodes: Node[], fault: Fault) {
    for (const edge of edges) {
      const line = points(edge.path, 3)
      for (const node of nodes) if (node.id !== edge.from && node.id !== edge.to && line.some(p => inside(p, node.r, 3))) fault(`the edge ${edge.from} → ${edge.to} goes through the node ${node.id}`)
      // a line that leaves its node, or enters its target, against the way to the target makes a hook
      const length = edge.path.getTotalLength()
      const at = (d: number) => edge.path.getPointAtLength(d)
      const [p0, p1, q0, q1] = [at(0), at(length), at(Math.min(8, length)), at(Math.max(0, length - 8))]
      const gx = p1.x - p0.x
      const gy = p1.y - p0.y
      const away = (dx: number, dy: number) => dx * gx + dy * gy < -0.2 * Math.hypot(dx, dy) * Math.hypot(gx, gy)
      // a loop around the outside leaves one way and comes back the other: a U-turn by design, not a hook
      const [sx, sy, ex, ey] = [q0.x - p0.x, q0.y - p0.y, p1.x - q1.x, p1.y - q1.y]
      const uTurn = sx * ex + sy * ey < -0.8 * Math.hypot(sx, sy) * Math.hypot(ex, ey)
      if (!uTurn && (away(sx, sy) || away(ex, ey))) fault(`the edge ${edge.from} → ${edge.to} leaves or enters its node backwards`)
    }
  }

  function labelFaults(section: Element, edges: Edge[], nodes: Node[], fault: Fault) {
    const labels = [...section.querySelectorAll('.dg-elabel')].map(l => ({ text: l.textContent!.trim(), own: `${l.getAttribute('data-from')}>${l.getAttribute('data-to')}`, r: l.getBoundingClientRect() }))
    labels.forEach((a, i) => {
      for (const b of labels.slice(i + 1)) {
        const gap = Math.max(b.r.left - a.r.right, a.r.left - b.r.right, b.r.top - a.r.bottom, a.r.top - b.r.bottom)
        if (gap < 0) fault(`the labels "${a.text}" and "${b.text}" overlap`)
        else if (gap < 6) fault(`the labels "${a.text}" and "${b.text}" are ${Math.round(gap)} px apart (6 at least)`)
      }
      // a split or a merged line starts or ends where the label's own line does, and the label may cover that join
      const own = edges.filter(edge => `${edge.from}>${edge.to}` === a.own).map(edge => ends(edge.path))
      const joins = (path: SVGPathElement) => own.some(o => near(o[0], ends(path)[0]) || near(o[1], ends(path)[1]))
      const on = edges.find(edge => `${edge.from}>${edge.to}` !== a.own && !joins(edge.path) && points(edge.path, 2).some(p => inside(p, a.r, 3)))
      if (on) fault(`the label "${a.text}" sits on the edge ${on.from} → ${on.to}`)
      for (const node of nodes) if (overlap(a.r, node.r)) fault(`the label "${a.text}" sits on the node ${node.id}`)
    })
  }

  function check(section: Element) {
    const fault: Fault = text => faults.push(`${section.getAttribute('data-name')}: ${text}`)
    const error = section.querySelector('.dg-error')
    if (error) return fault(error.textContent!.trim())
    const drawing = section.querySelector('[data-bn-diagram]')!
    if (![...drawing.children].some(child => child.tagName !== 'SCRIPT')) return fault('draws nothing')
    const nodes = [...section.querySelectorAll('[data-n]')].map(n => ({ id: n.getAttribute('data-n')!, r: n.getBoundingClientRect() }))
    const edges = [...section.querySelectorAll<SVGPathElement>('path.dg-e')].map(p => ({ from: p.getAttribute('data-from')!, to: p.getAttribute('data-to')!, path: p }))
    edgeFaults(edges, nodes, fault)
    labelFaults(section, edges, nodes, fault)
  }

  function finish() {
    const errors = (window as unknown as { nookErrors: string[] }).nookErrors
    errors.forEach(error => faults.push(`the page: ${error}`))
    for (const family of FONTS) if (![...document.fonts].some(face => face.family.includes(family) && face.status === 'loaded')) faults.push(`the page: the font ${family} of Bench did not load, so no size is the real one`)
    document.querySelectorAll('section[data-name]').forEach(section => {
      try {
        check(section)
      } catch (error) {
        faults.push(`${section.getAttribute('data-name')}: the check failed: ${(error as Error).message}`)
      }
    })
    const pre = document.createElement('pre')
    pre.id = 'nook-probe'
    pre.textContent = encodeURIComponent(JSON.stringify(faults))
    document.body.append(pre)
  }

  // a font loads only when text asks for it; ask for it, so that a page with no text still proves the font came
  addEventListener('load', () => Promise.all(FONTS.map(family => document.fonts.load(`16px "${family}"`))).then(() => document.fonts.ready).then(() => setTimeout(finish, 500)))
}
