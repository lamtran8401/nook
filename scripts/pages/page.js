(() => {
  const NS = 'http://www.w3.org/2000/svg'

  // A box never rounds past about a third of its height.
  function fitCorners() {
    document.querySelectorAll('.shape').forEach(el => {
      el.style.borderRadius = ''
      const role = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 35.2
      el.style.borderRadius = Math.min(role, 0.32 * el.offsetHeight) + 'px'
    })
  }

  function point(c, t) {
    const u = 1 - t
    return [0, 1].map(k => u * u * u * c[0][k] + 3 * u * u * t * c[1][k] + 3 * u * t * t * c[2][k] + t * t * t * c[3][k])
  }

  // Curves between the nodes of one diagram: forward, down, up, or a U under both ends.
  function route(a, b) {
    const ax = a.left + a.width / 2, bx = b.left + b.width / 2
    if (b.top >= a.bottom - 4) {
      const y0 = a.bottom, y1 = b.top, mid = (y0 + y1) / 2
      return [[ax, y0], [ax, mid], [bx, mid], [bx, y1]]
    }
    if (b.bottom <= a.top + 4) {
      const y0 = a.top, y1 = b.bottom, mid = (y0 + y1) / 2
      return [[ax, y0], [ax, mid], [bx, mid], [bx, y1]]
    }
    const ay = a.top + a.height / 2, by = b.top + b.height / 2
    const x0 = b.left > a.left ? a.right : a.left, x1 = b.left > a.left ? b.left : b.right
    const pull = (x1 - x0) / 2
    return [[x0, ay], [x0 + pull, ay], [x1 - pull, by], [x1, by]]
  }

  function draw(dg) {
    const svg = dg.querySelector('svg.dg-edges')
    dg.querySelectorAll('.dg-label').forEach(l => l.remove())
    svg.replaceChildren()
    const box = dg.getBoundingClientRect()
    const rect = id => {
      const r = dg.querySelector(`[data-id="${id}"]`).getBoundingClientRect()
      return { left: r.left - box.left, right: r.right - box.left, top: r.top - box.top, bottom: r.bottom - box.top, width: r.width, height: r.height }
    }
    const tips = new Set()
    for (const [from, to, label, kind, depth = 40] of JSON.parse(dg.dataset.edges)) {
      const a = rect(from), b = rect(to)
      let d, tip, base, at
      if (kind === 'u' || kind === 'n') {
        // a lane under (u) or over (n) both nodes, with rounded turns
        const s = kind === 'u' ? 1 : -1
        const ax = a.left + a.width / 2, bx = b.left + b.width / 2
        const y0 = kind === 'u' ? a.bottom : a.top, y1 = kind === 'u' ? b.bottom : b.top
        const lane = kind === 'u' ? Math.max(y0, y1) + depth : Math.min(y0, y1) - depth
        const dx = Math.sign(bx - ax) || 1, r = Math.min(16, Math.abs(bx - ax) / 2, depth / 2)
        tip = [bx, y1 + s]
        base = [bx, y1 + s * 8]
        d = `M${ax},${y0} L${ax},${lane - s * r} Q${ax},${lane} ${ax + dx * r},${lane} L${bx - dx * r},${lane} Q${bx},${lane} ${bx},${lane - s * r} L${base}`
        at = [(ax + bx) / 2, lane]
      } else {
        const c = route(a, b)
        const [ex, ey] = c[3], [px, py] = point(c, 0.97)
        const len = Math.hypot(ex - px, ey - py) || 1
        const ux = (ex - px) / len, uy = (ey - py) / len
        tip = [ex - ux, ey - uy]
        base = [ex - ux * 8, ey - uy * 8]
        at = point(c, 0.5)
        d = `M${c[0]} C${c[1]} ${c[2]} ${base}`
      }
      const path = document.createElementNS(NS, 'path')
      path.setAttribute('d', d)
      svg.append(path)
      // lines into one point share one arrowhead
      const key = tip.map(Math.round).join(',')
      if (!tips.has(key)) {
        tips.add(key)
        const len = Math.hypot(tip[0] - base[0], tip[1] - base[1]) || 1
        const nx = -(tip[1] - base[1]) / len * 4, ny = (tip[0] - base[0]) / len * 4
        const head = document.createElementNS(NS, 'path')
        head.setAttribute('d', `M${tip} L${base[0] + nx},${base[1] + ny} L${base[0] - nx},${base[1] - ny} Z`)
        head.setAttribute('class', 'arrowhead')
        svg.append(head)
      }
      if (label) {
        const el = document.createElement('span')
        el.className = 'dg-label' + (label.startsWith('★') ? ' is-gate' : '')
        el.textContent = label
        el.style.left = at[0] + 'px'
        el.style.top = at[1] + 'px'
        dg.append(el)
      }
    }
  }

  function layout() {
    fitCorners()
    document.querySelectorAll('.dg').forEach(draw)
  }

  let frame = 0
  const relayout = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(layout) }
  layout()
  addEventListener('resize', relayout)
  if (document.fonts) document.fonts.ready.then(relayout)

  // The tab bar shows its hairline and shadow only while stuck.
  const bar = document.querySelector('.tabbar')
  const sentinel = document.querySelector('.stick-sentinel')
  if (bar && sentinel && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => bar.classList.toggle('stuck', !e.isIntersecting)).observe(sentinel)
  }

  // The tab of the section in view.
  const tabs = [...document.querySelectorAll('.tab')]
  const sections = tabs.map(t => document.getElementById(t.getAttribute('href').slice(1))).filter(Boolean)
  const strip = document.querySelector('.tabbar-in')
  function mark() {
    const line = (bar ? bar.getBoundingClientRect().bottom : 0) + 24
    let current = sections[0]
    for (const s of sections) if (s.getBoundingClientRect().top <= line) current = s
    tabs.forEach(t => {
      const on = current && t.getAttribute('href') === '#' + current.id
      if (on && t.getAttribute('aria-current') !== 'true') {
        const left = t.offsetLeft - strip.offsetLeft
        if (left < strip.scrollLeft || left + t.offsetWidth > strip.scrollLeft + strip.clientWidth) strip.scrollLeft = left - 16
      }
      t.setAttribute('aria-current', on ? 'true' : 'false')
    })
  }
  addEventListener('scroll', () => requestAnimationFrame(mark), { passive: true })
  mark()
})()
