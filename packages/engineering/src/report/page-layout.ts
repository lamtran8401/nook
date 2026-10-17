/**
 * The layout of the item page around the components of the UI kit, and the page script. The colours, the
 * shadows and the components come from the UI kit; this file places them and adds the parts that Nook has
 * no component for: the edges of a diagram, a sequence diagram, a table that stacks on a phone.
 */

export const PAGE_LAYOUT = `
body { margin: 0; background: var(--bg); }
.kd-page {
  max-width: 820px; margin: 0 auto; min-height: 100vh; box-sizing: border-box;
  padding: 32px max(16px, env(safe-area-inset-right, 0px)) 80px max(16px, env(safe-area-inset-left, 0px));
  display: flex; flex-direction: column; gap: var(--space-5);
}
.kd-page *, .kd-page *::before, .kd-page *::after { box-sizing: border-box; }
.kd-head { display: flex; flex-direction: column; gap: var(--space-3); }
.kd-eyebrow { font: 600 12px/16px var(--font-sans); letter-spacing: .04em; text-transform: uppercase; color: var(--fg-muted); }
.kd-head .bn-page-head__title { overflow-wrap: anywhere; }
.kd-audit, .kd-doc-meta { margin: 0; font: 400 12px/18px var(--font-mono); color: var(--fg-muted); overflow-wrap: anywhere; }
.kd-page .bn-tabs { position: relative; }
.kd-page .bn-tabs__panel { padding-top: var(--space-5); display: flex; flex-direction: column; gap: var(--space-6); }
/* a hidden panel keeps its layout, so its diagrams keep their size */
.kd-page .bn-tabs__panel[hidden] { display: flex; position: absolute; top: 0; left: 0; right: 0; height: 0; overflow: hidden; visibility: hidden; pointer-events: none; }
.kd-doc-head { display: flex; flex-direction: column; gap: 6px; }
.kd-doc-title { margin: 0; font: 700 24px/30px var(--font-sans); letter-spacing: -.02em; overflow-wrap: anywhere; }
.kd-sec { display: flex; flex-direction: column; gap: var(--space-4); min-width: 0; }
.kd-sec__title { margin: 0; font: 600 20px/28px var(--font-sans); letter-spacing: -.01em; }
.kd-page .bn-prose { max-width: none; font-size: 16px; line-height: 26px; overflow-wrap: anywhere; }
.kd-page .bn-prose > :first-child { margin-top: 0; }
.kd-page .bn-prose h3 { font-size: 17px; line-height: 24px; margin-top: 1.2em; }
.kd-page .bn-alert__body { overflow-wrap: anywhere; }
.kd-page .bn-table td { vertical-align: top; overflow-wrap: break-word; }
.kd-page .bn-table td:first-child { font-weight: 600; }
.kd-page .bn-table td:first-child .bn-inline-code { white-space: nowrap; }
.kd-page .bn-inline-code { font-size: .86em; overflow-wrap: break-word; -webkit-box-decoration-break: clone; box-decoration-break: clone; }
.kd-empty { margin: 0; color: var(--fg-muted); }
@media (max-width: 560px) {
  .kd-stack .bn-table thead { display: none; }
  .kd-stack .bn-table, .kd-stack .bn-table tbody, .kd-stack .bn-table tr, .kd-stack .bn-table td { display: block; width: 100%; }
  .kd-stack .bn-table tr { padding: 12px var(--space-4); border-bottom: var(--stroke-1) solid var(--border); }
  .kd-stack .bn-table tr:last-child { border-bottom: 0; }
  .kd-stack .bn-table td { padding: 0; border: 0; }
  .kd-stack .bn-table td + td { margin-top: 8px; }
  .kd-stack .bn-table td::before { content: attr(data-label); display: block; font: 600 11px/16px var(--font-sans); letter-spacing: .03em; text-transform: uppercase; color: var(--fg-muted); }
  .kd-stack .bn-table td:first-child::before { display: none; }
  .kd-stack .bn-table tbody tr:hover td { background: none; }
}

/* the criteria */
.kd-acs .bn-list__item { align-items: flex-start; }
.kd-acs .bn-list__icon { font: 600 11px/1 var(--font-mono); }
.kd-acs .bn-list__main { display: flex; flex-direction: column; gap: 4px; font-size: 15px; line-height: 22px; overflow-wrap: anywhere; }
.kd-ac-tags { display: flex; align-items: center; gap: var(--space-2); }
.kd-ac-src { color: var(--fg-muted); font: 500 12px/16px var(--font-mono); }

/* the steps of Try it */
.kd-try .bn-rm-stage__title { font-size: 16px; line-height: 24px; overflow-wrap: anywhere; }
.kd-try .bn-rm-stage__desc { margin-bottom: 0; overflow-wrap: anywhere; }
.kd-try .bn-rm-stage:last-child { padding-bottom: 0; }

/* the tree of the changed files */
.kd-tree { overflow-x: auto; }
.kd-tree > ul { padding-left: 0; }
.kd-tree .bn-tree__row { height: 32px; min-width: 0; cursor: default; }
.kd-tree .bn-tree__row:hover { background: none; }
.kd-tree summary .bn-tree__row { cursor: pointer; }
.kd-tree summary .bn-tree__row:hover { background: var(--bg-muted); }
.kd-tree details > summary .bn-tree__row::before { display: none; }
.kd-chev { display: inline-flex; flex: none; width: 14px; height: 14px; align-items: center; justify-content: center; color: var(--fg-muted); transition: transform .15s; }
.kd-chev svg { width: 14px; height: 14px; }
.kd-chev--leaf { visibility: hidden; }
.kd-tree details[open] > summary .kd-chev { transform: rotate(90deg); }
b.kd-tree__name { flex: none; font-weight: 600; }
code.kd-tree__name { flex: none; font: 500 12.5px/20px var(--font-mono); color: var(--fg); white-space: nowrap; }
.kd-tree__note { flex: 1 1 auto; min-width: 0; color: var(--fg-muted); font-size: 12.5px; line-height: 20px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.kd-tree .bn-tree__row > small { flex: none; padding: 0 6px; }
@media (prefers-reduced-motion: reduce) { .kd-chev { transition: none; } }

/* the slices */
.kd-slices { display: flex; flex-direction: column; gap: var(--space-4); }
.kd-page .bn-card__title { font-size: 18px; line-height: 26px; overflow-wrap: anywhere; }
.kd-page .bn-card .bn-dl dd { overflow-wrap: anywhere; min-width: 0; }
.kd-page .bn-card__foot { flex-wrap: wrap; }

/* diagrams */
.kd-dg { margin: 0; display: flex; flex-direction: column; gap: var(--space-4); min-width: 0; }
.kd-dg__scroll { overflow-x: auto; padding: 14px 12px 24px; margin: -14px -12px -24px; }
.kd-dg__canvas { position: relative; min-width: min-content; }
.kd-dg > figcaption { justify-content: center; text-align: center; }
.kd-dg__note { font: 500 12px/16px var(--font-sans); color: var(--fg-muted); }
.kd-lanes-note { margin: 0; color: var(--fg-muted); font-size: 15px; line-height: 24px; }
.kd-edges { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; z-index: 0; }
.kd-edges .kd-edge--main { stroke-width: var(--stroke-3); }
.kd-head { fill: var(--border-strong); stroke: none; }
.kd-head[data-tone] { fill: var(--t); }
.kd-edge-label {
  position: absolute; z-index: 2; width: max-content; max-width: 168px; padding: 2px 8px; transform: translate(-50%, -50%);
  border-radius: var(--radius-full); background: var(--bg); box-shadow: inset 0 0 0 0.5px var(--hairline);
  font: 500 12px/16px var(--font-sans); color: var(--fg-muted); text-align: center; overflow-wrap: anywhere;
}
.kd-edge-label:not([data-placed]) { visibility: hidden; }
.kd-dg .bn-node { position: relative; z-index: 1; min-width: 0; }
.kd-dg .bn-node__title, .kd-dg .bn-node__meta { overflow-wrap: anywhere; }
.kd-flow { display: flex; flex-direction: column; gap: 64px; }
.kd-layer { display: flex; justify-content: center; gap: var(--space-4); }
.kd-layer > .bn-node { flex: 0 1 220px; min-width: 96px; }
.kd-layer > .bn-node[data-shape="pill"] { flex: 0 1 auto; }
.kd-seq { display: grid; grid-template-columns: repeat(var(--actors), minmax(88px, 1fr)); grid-auto-rows: minmax(54px, auto); align-items: end; min-width: min-content; }
.kd-seq__actor { justify-self: center; align-self: center; position: relative; z-index: 1; padding: 0 4px 10px; }
.kd-seq__actor .bn-node__title { white-space: nowrap; }
.kd-seq__life { justify-self: center; align-self: stretch; width: 0; border-left: var(--stroke-2) dashed var(--border); }
.kd-seq__call { margin-inline: calc(100% / (2 * var(--span))); padding-bottom: 12px; display: flex; flex-direction: column; align-items: center; gap: 4px; position: relative; z-index: 1; min-width: 0; color: var(--fg-muted); }
.kd-seq__label { width: max-content; max-width: max(100%, 176px); padding: 0 6px; border-radius: 6px; background: var(--bg); font: 500 13px/18px var(--font-sans); color: var(--fg); text-align: center; overflow-wrap: break-word; }
.kd-seq__line { align-self: stretch; height: 0; border-top: var(--stroke-2) solid currentColor; position: relative; }
.kd-seq__line::after { content: ""; position: absolute; top: -5.75px; right: -1px; border-style: solid; border-color: transparent; border-width: 5px 0 5px 8px; border-left-color: currentColor; }
.kd-seq__call.is-left .kd-seq__line::after { right: auto; left: -1px; border-width: 5px 8px 5px 0; border-left-color: transparent; border-right-color: currentColor; }
.kd-seq__call.is-reply { color: var(--border-strong); }
.kd-seq__call.is-reply .kd-seq__line { border-top-style: dashed; }
.kd-seq__call.is-self { margin-left: 50%; margin-right: 0; align-items: flex-start; }
.kd-seq__call.is-self .kd-seq__line { align-self: flex-start; width: 28px; height: 14px; border: var(--stroke-2) solid currentColor; border-left: 0; border-radius: 0 8px 8px 0; }
.kd-seq__call.is-self .kd-seq__line::after { display: none; }
.kd-seq__note { margin-inline: max(4px, calc(100% / (2 * var(--span)) - 56px)); padding-bottom: 10px; position: relative; z-index: 1; display: flex; }
.kd-seq__note .bn-node { flex: 1; align-items: center; text-align: center; }
.kd-lanes { display: grid; column-gap: var(--space-4); min-width: min-content; }
.kd-lanes .bn-group { margin-top: 10px; }
.kd-lanes .bn-group__label { white-space: nowrap; }
.kd-lanes__cell { display: flex; padding: 44px var(--space-3) 0; position: relative; z-index: 1; }
.kd-lanes__cell > .bn-node { flex: 1; }
@media (prefers-color-scheme: dark) {
  :where(:root:not([data-theme])) .bn-node { box-shadow: 0 0 0 0.5px var(--hairline), 0 12px 28px -12px rgba(0,0,0,.7); }
}
`

/** The diagram edges, drawn where the browser placed the nodes, and the tab in the address of the page. */
export const PAGE_SCRIPT = `
(function () {
  function rel(el, box) {
    var r = el.getBoundingClientRect()
    return { l: r.left - box.left, t: r.top - box.top, w: r.width, h: r.height }
  }
  function groupBy(list, key) {
    var out = {}
    list.forEach(function (e) { (out[key(e)] = out[key(e)] || []).push(e) })
    return out
  }
  // edges that reach the same node share its top side, in the order of the nodes they come from
  function spread(list, end, other) {
    var groups = groupBy(list, function (e) { return e[end + 'Id'] })
    Object.keys(groups).forEach(function (id) {
      var g = groups[id].sort(function (x, y) { return (x[other].l + x[other].w / 2) - (y[other].l + y[other].w / 2) })
      g.forEach(function (e, k) { e[end + 'X'] = e[end].l + e[end].w * (k + 1) / (g.length + 1) })
    })
  }
  function draw(canvas) {
    var box = canvas.getBoundingClientRect()
    if (!box.width) return
    var nodes = {}
    canvas.querySelectorAll('[data-node]').forEach(function (n) { nodes[n.getAttribute('data-node')] = rel(n, box) })
    var edges = []
    canvas.querySelectorAll('path[data-edge]').forEach(function (p) {
      var a = nodes[p.getAttribute('data-from')], b = nodes[p.getAttribute('data-to')]
      if (!a || !b) return
      edges.push({ p: p, i: p.getAttribute('data-edge'), a: a, b: b, aId: p.getAttribute('data-from'), bId: p.getAttribute('data-to'), down: b.t >= a.t + a.h - 1 })
    })
    var down = edges.filter(function (e) { return e.down })
    // edges that leave one node start close together at its middle, so a skip edge does not cover a short one
    var leave = groupBy(down, function (e) { return e.aId })
    Object.keys(leave).forEach(function (id) {
      var g = leave[id].sort(function (x, y) { return (x.b.l + x.b.w / 2) - (y.b.l + y.b.w / 2) })
      var step = Math.min(20, g[0].a.w / (g.length + 1))
      g.forEach(function (e, k) { e.aX = e.a.l + e.a.w / 2 + (k - (g.length - 1) / 2) * step })
    })
    spread(down, 'b', 'a')
    edges.forEach(function (e) {
      var pts
      var head
      if (e.down) {
        var sy = e.a.t + e.a.h, ty = e.b.t, dy = Math.max(20, (ty - sy) / 2)
        pts = [[e.aX, sy], [e.aX, sy + dy], [e.bX, ty - 8 - dy], [e.bX, ty - 8]]
        head = 'M' + (e.bX - 5) + ' ' + (ty - 9) + 'L' + e.bX + ' ' + (ty - 1) + 'L' + (e.bX + 5) + ' ' + (ty - 9) + 'Z'
      } else if (e.b.l >= e.a.l + e.a.w) {
        var y1 = e.a.t + e.a.h / 2, y2 = e.b.t + e.b.h / 2, x1 = e.a.l + e.a.w, x2 = e.b.l - 8, mx = (x1 + x2) / 2
        pts = [[x1, y1], [mx, y1], [mx, y2], [x2, y2]]
        head = 'M' + (x2 - 1) + ' ' + (y2 - 5) + 'L' + (x2 + 7) + ' ' + y2 + 'L' + (x2 - 1) + ' ' + (y2 + 5) + 'Z'
      } else {
        var ys = e.a.t + e.a.h / 2, yt = e.b.t + e.b.h / 2, xs = e.a.l + e.a.w, xt = e.b.l + e.b.w + 8
        var bulge = Math.max(xs, xt) + 44
        pts = [[xs, ys], [bulge, ys], [bulge, yt], [xt, yt]]
        head = 'M' + (xt + 1) + ' ' + (yt - 5) + 'L' + (xt - 7) + ' ' + yt + 'L' + (xt + 1) + ' ' + (yt + 5) + 'Z'
      }
      e.p.setAttribute('d', 'M' + pts[0].join(' ') + 'C' + pts[1].join(' ') + ',' + pts[2].join(' ') + ',' + pts[3].join(' '))
      var h = canvas.querySelector('[data-head="' + e.i + '"]')
      if (h) h.setAttribute('d', head)
      // a label past the middle of a downward edge, where edges from one node are apart
      var t = e.down ? 0.6 : 0.5, u = 1 - t
      var at = function (k) { return u * u * u * pts[0][k] + 3 * u * u * t * pts[1][k] + 3 * u * t * t * pts[2][k] + t * t * t * pts[3][k] }
      e.mid = [at(0), at(1)]
    })
    place(canvas, edges, box.width)
  }
  // a label sits at the middle of its edge; two labels that touch move apart along the row
  function place(canvas, edges, width) {
    var labels = []
    edges.forEach(function (e) {
      var el = canvas.querySelector('[data-label="' + e.i + '"]')
      if (el) labels.push({ el: el, x: e.mid[0], y: e.mid[1], w: el.offsetWidth, h: el.offsetHeight })
    })
    for (var pass = 0; pass < 8; pass++) {
      labels.sort(function (p, q) { return p.x - q.x })
      for (var i = 0; i < labels.length; i++) for (var j = i + 1; j < labels.length; j++) {
        var p = labels[i], q = labels[j]
        var overX = (p.w + q.w) / 2 + 6 - (q.x - p.x), overY = (p.h + q.h) / 2 + 2 - Math.abs(q.y - p.y)
        if (overX > 0 && overY > 0) { p.x -= overX / 2; q.x += overX / 2 }
      }
    }
    labels.forEach(function (l) {
      l.x = Math.min(Math.max(l.x, l.w / 2), width - l.w / 2)
      l.el.style.left = l.x + 'px'
      l.el.style.top = l.y + 'px'
      l.el.setAttribute('data-placed', '')
    })
  }
  function drawAll() { document.querySelectorAll('[data-kd-canvas]').forEach(draw) }
  function start() {
    drawAll()
    if (window.ResizeObserver) {
      var watch = new ResizeObserver(drawAll)
      document.querySelectorAll('[data-kd-canvas]').forEach(function (c) { watch.observe(c) })
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawAll)
    window.addEventListener('load', drawAll)
    var tabs = document.querySelectorAll('.kd-page [role="tab"]')
    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        try { history.replaceState(null, '', '#' + t.getAttribute('data-doc')) } catch (e) {}
      })
    })
    var wanted = location.hash.slice(1)
    tabs.forEach(function (t) { if (t.getAttribute('data-doc') === wanted) t.click() })
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start)
  else start()
})()
`
