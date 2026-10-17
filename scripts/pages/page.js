(() => {
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
