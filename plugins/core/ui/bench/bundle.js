/* Bench — vanilla behaviour layer. Không phụ thuộc thư viện. Gán window.Bench. */
(function () {
  'use strict';
  var P = {
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    'check-circle': '<circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/>',
    'x-circle': '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5l5 5M14.5 9.5l-5 5"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.5 5.7 3.5 9s-1 6.3-3.5 9c-2.5-2.7-3.5-5.7-3.5-9s1-6.3 3.5-9z"/>',
    flask: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3"/><path d="M7.5 15h9"/>',
    headphones: '<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="5" height="7" rx="2"/><rect x="16" y="14" width="5" height="7" rx="2"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
    quote: '<path d="M10 7H6a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h3v1a3 3 0 0 1-3 3M20 7h-4a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h3v1a3 3 0 0 1-3 3"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    'chevron-down': '<path d="M6 9l6 6 6-6"/>',
    'chevron-right': '<path d="M9 6l6 6-6 6"/>',
    'chevron-left': '<path d="M15 6l-6 6 6 6"/>',
    'arrow-right': '<path d="M5 12h14M13 6l6 6-6 6"/>',
    'arrow-up-right': '<path d="M7 17L17 7M8 7h9v9"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="3"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    more: '<circle cx="6" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="18" cy="12" r="1.2"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5v.01"/>',
    alert: '<path d="M12 3.5L21.5 20h-19z"/><path d="M12 10v4M12 17v.01"/>',
    bot: '<rect x="4" y="8" width="16" height="12" rx="4"/><path d="M12 4v4M9 14v.01M15 14v.01"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1.2-3.5 3.6-5.5 6.5-5.5s5.3 2 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5c1.6.6 2.8 2.4 3.5 5.5"/>',
    file: '<path d="M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M14 3v5h5"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    pin: '<path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    sparkle: '<path d="M12 3l2 7 7 2-7 2-2 7-2-7-7-2 7-2z"/>',
    play: '<path d="M7 5l12 7-12 7z"/>',
    terminal: '<path d="M5 7l5 5-5 5M12 18h7"/>',
    branch: '<circle cx="6" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="8" r="2"/><path d="M6 8v8M18 10c0 4-4 5-10 6.5"/>',
    home: '<path d="M4 11l8-7 8 7v8a2 2 0 0 1-2 2h-4v-6h-4v6H6a2 2 0 0 1-2-2z"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5M5 20h14"/>',
    download: '<path d="M12 4v12M7 11l5 5 5-5M5 20h14"/>',
    send: '<path d="M4 12l16-8-6 16-3-7z"/>',
    trash: '<path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    filter: '<path d="M4 5h16l-6 7.5V19l-4 1v-7.5z"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5M19 19v2H6"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    plane: '<path d="M3 13l7-2 4-7 2 1-2 7 6 1v2l-6 1 2 5-2 1-4-5-7-2z"/>',
    coffee: '<path d="M5 9h12v5a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5zM17 10h1a3 3 0 0 1 0 6h-1M8 3v3M12 3v3"/>',
    database: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/>',
    zap: '<path d="M13 3L5 13h6l-1 8 8-10h-6z"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="3"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    eye: '<path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7S2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>'
  };

  function icon(name, size) {
    var body = P[name] || P.info, s = size || 24;
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + '</svg>';
  }

  function once(el, key) { var k = 'bnB' + key; if (el.dataset[k]) return false; el.dataset[k] = '1'; return true; }
  function $all(root, sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)); }

  var region = null;
  function toast(opts) {
    opts = typeof opts === 'string' ? { title: opts } : (opts || {});
    if (!region || !document.body.contains(region)) {
      region = document.createElement('div');
      region.className = 'bn-toast-region';
      region.setAttribute('aria-live', 'polite');
      document.body.appendChild(region);
    }
    var tone = opts.tone || 'success';
    var glyph = { success: 'check', danger: 'x', warning: 'alert', primary: 'info', info: 'info', neutral: 'info' }[tone] || 'info';
    var el = document.createElement('div');
    el.className = 'bn-toast';
    el.setAttribute('data-tone', tone);
    el.setAttribute('role', 'status');
    el.innerHTML = '<span class="bn-toast__icon"><span class="bn-icon">' + icon(glyph) + '</span></span><div><div class="bn-toast__title"></div><div class="bn-toast__body"></div></div><button class="bn-toast__close" aria-label="Đóng"><span class="bn-icon">' + icon('x') + '</span></button>';
    el.querySelector('.bn-toast__title').textContent = opts.title || '';
    var b = el.querySelector('.bn-toast__body');
    if (opts.body) b.textContent = opts.body; else b.remove();
    var close = function () { if (el.parentNode) el.parentNode.removeChild(el); };
    el.querySelector('.bn-toast__close').addEventListener('click', close);
    region.appendChild(el);
    if (opts.timeout !== 0) setTimeout(close, opts.timeout || 4500);
    return close;
  }

  function setTheme(theme, target) {
    (target || document.documentElement).setAttribute('data-theme', theme);
    try { localStorage.setItem('bn-theme', theme); } catch (e) {}
  }
  var THEMES = ['light', 'dark', 'wire'];

  function placePopover(pop, invoker) {
    if (!invoker) return;
    var r = invoker.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
    var left = Math.min(Math.max(8, r.left), window.innerWidth - w - 8);
    var top = r.bottom + 6;
    if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 6);
    pop.style.left = left + 'px';
    pop.style.top = top + 'px';
  }

  function init(root) {
    root = root || document;

    $all(root, '[data-bn-icon]').forEach(function (el) {
      if (!once(el, 'icon')) return;
      if (!el.classList.contains('bn-icon')) el.classList.add('bn-icon');
      el.innerHTML = icon(el.getAttribute('data-bn-icon'));
    });

    $all(root, '[data-bn-tabs]').forEach(function (box) {
      if (!once(box, 'tabs')) return;
      var tabs = $all(box, '[role="tab"]');
      function select(t) {
        tabs.forEach(function (x) {
          var on = x === t;
          x.setAttribute('aria-selected', on ? 'true' : 'false');
          x.tabIndex = on ? 0 : -1;
          var p = document.getElementById(x.getAttribute('aria-controls'));
          if (p) p.hidden = !on;
        });
      }
      tabs.forEach(function (t, i) {
        t.addEventListener('click', function () { select(t); });
        t.addEventListener('keydown', function (e) {
          var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
          if (!d) return;
          var n = tabs[(i + d + tabs.length) % tabs.length]; n.focus(); select(n); e.preventDefault();
        });
      });
    });

    $all(root, '[data-bn-open]').forEach(function (btn) {
      if (!once(btn, 'open')) return;
      btn.addEventListener('click', function () {
        var d = document.getElementById(btn.getAttribute('data-bn-open'));
        if (d && d.showModal && !d.open) d.showModal();
        var inp = d && d.querySelector('[data-bn-command] input');
        if (inp) { inp.value = ''; inp.dispatchEvent(new Event('input')); inp.focus(); }
      });
    });
    $all(root, 'dialog.bn-dialog, dialog.bn-command').forEach(function (d) {
      if (!once(d, 'dlg')) return;
      d.addEventListener('click', function (e) { if (e.target === d) d.close(); });
    });
    $all(root, '[data-bn-close]').forEach(function (btn) {
      if (!once(btn, 'close')) return;
      btn.addEventListener('click', function () { var d = btn.closest('dialog'); if (d) d.close(); });
    });

    $all(root, '[popover]').forEach(function (pop) {
      if (!once(pop, 'pop')) return;
      pop.addEventListener('toggle', function (e) {
        if (e.newState !== 'open') return;
        placePopover(pop, document.querySelector('[popovertarget="' + pop.id + '"]'));
      });
    });

    $all(root, '[data-bn-toast]').forEach(function (btn) {
      if (!once(btn, 'toast')) return;
      btn.addEventListener('click', function () {
        toast({ title: btn.getAttribute('data-bn-toast'), body: btn.getAttribute('data-bn-toast-body') || '', tone: btn.getAttribute('data-tone') || 'success' });
      });
    });

    $all(root, '[data-bn-copy]').forEach(function (btn) {
      if (!once(btn, 'copy')) return;
      btn.addEventListener('click', function () {
        var src = btn.closest('.bn-code, .bn-terminal, .bn-approval');
        var pre = src && src.querySelector('pre, .bn-approval__cmd');
        if (!pre) return;
        var done = function () { toast({ title: 'Đã sao chép', tone: 'success', timeout: 1800 }); };
        if (navigator.clipboard) navigator.clipboard.writeText(pre.innerText).then(done, function () {}); else done();
      });
    });

    $all(root, '[data-bn-dismiss]').forEach(function (btn) {
      if (!once(btn, 'dismiss')) return;
      btn.addEventListener('click', function () { var t = btn.closest('[data-bn-dismissible]'); if (t) t.remove(); });
    });

    $all(root, '[data-bn-toggle-pressed]').forEach(function (btn) {
      if (!once(btn, 'press')) return;
      btn.addEventListener('click', function () { btn.setAttribute('aria-pressed', btn.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'); });
    });

    $all(root, '.bn-slider').forEach(function (s) {
      if (!once(s, 'slider')) return;
      var upd = function () {
        var v = ((s.value - (s.min || 0)) / ((s.max || 100) - (s.min || 0))) * 100;
        s.style.setProperty('--v', v + '%');
        var out = s.id && document.querySelector('output[for="' + s.id + '"]');
        if (out) out.textContent = s.value;
      };
      s.addEventListener('input', upd); upd();
    });

    $all(root, '[data-bn-theme-toggle]').forEach(function (btn) {
      if (!once(btn, 'theme')) return;
      btn.addEventListener('click', function () {
        var cur = document.documentElement.getAttribute('data-theme') || 'light';
        setTheme(THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length]);
      });
    });

    $all(root, '[data-bn-command]').forEach(function (box) {
      if (!once(box, 'cmd')) return;
      var input = box.querySelector('input');
      var items = $all(box, '.bn-command__item');
      var empty = box.querySelector('.bn-command__empty');
      function visible() { return items.filter(function (i) { return !i.hidden; }); }
      function mark(el) { items.forEach(function (i) { i.setAttribute('aria-selected', i === el ? 'true' : 'false'); }); if (el) el.scrollIntoView({ block: 'nearest' }); }
      function filter() {
        var q = (input.value || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
        items.forEach(function (i) {
          var t = (i.textContent + ' ' + (i.getAttribute('data-keywords') || '')).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
          i.hidden = q && t.indexOf(q) < 0;
        });
        var v = visible(); mark(v[0]);
        if (empty) empty.hidden = v.length > 0;
      }
      input.addEventListener('input', filter);
      input.addEventListener('keydown', function (e) {
        var v = visible(), cur = v.findIndex(function (i) { return i.getAttribute('aria-selected') === 'true'; });
        if (e.key === 'ArrowDown') { mark(v[Math.min(v.length - 1, cur + 1)]); e.preventDefault(); }
        if (e.key === 'ArrowUp') { mark(v[Math.max(0, cur - 1)]); e.preventDefault(); }
        if (e.key === 'Enter' && v[cur]) { v[cur].click(); }
      });
      items.forEach(function (i) {
        i.addEventListener('mousemove', function () { mark(i); });
        i.addEventListener('click', function () { var d = box.closest('dialog'); if (d) d.close(); });
      });
      filter();
    });

    if (!document.documentElement.dataset.bnKeys) {
      document.documentElement.dataset.bnKeys = '1';
      document.addEventListener('keydown', function (e) {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
          var d = document.querySelector('dialog.bn-command');
          if (d && !d.open) { e.preventDefault(); d.showModal(); var i = d.querySelector('input'); if (i) i.focus(); }
        }
      });
    }
    return root;
  }

  window.Bench = { version: '6.1.0', icon: icon, icons: Object.keys(P), init: init, toast: toast, setTheme: setTheme, themes: THEMES };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { init(document); });
  else init(document);
})();

/* Bench diagrams: graph, sequence, mind, links, tree, timeline, board and chart, drawn from a JSON spec.
   From the Kit Diagram Catalog v30. No dependency. window.BenchDiagrams = { render(el, spec), mount(root) }. */
(function () {
  'use strict'
  var NS = 'http://www.w3.org/2000/svg'
  function s(tag, attrs, parent) {
    var el = document.createElementNS(NS, tag)
    for (var k in attrs || {}) if (attrs[k] !== undefined && attrs[k] !== null) el.setAttribute(k, attrs[k])
    if (parent) parent.appendChild(el)
    return el
  }
  function h(tag, cls, html) {
    var el = document.createElement(tag)
    if (cls) el.className = cls
    if (html !== undefined) el.innerHTML = html
    return el
  }
  function text(parent, x, y, words, attrs) {
    var t = s('text', Object.assign({ x: x, y: y }, attrs || {}), parent)
    t.textContent = words
    return t
  }
  function esc(v) { return String(v).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] }) }
  function tone(t) { return t ? ' data-tone="' + esc(t) + '"' : '' }

  /* ---------- icons: 24px stroke paths ---------- */
  var ICONS = {
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1-3 3.5-4.5 6.5-4.5s5.5 1.5 6.5 4.5M16 4.5a3.5 3.5 0 0 1 0 7M17.5 15.5c2 .6 3.4 2 4 4.5"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.5 5.7 3.5 9s-1 6.3-3.5 9c-2.5-2.7-3.5-5.7-3.5-9s1-6.3 3.5-9"/>',
    phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
    monitor: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
    server: '<rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01"/>',
    database: '<ellipse cx="12" cy="5.5" rx="8" ry="3"/><path d="M4 5.5v13c0 1.7 3.6 3 8 3s8-1.3 8-3v-13M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
    zap: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    queue: '<rect x="3" y="4" width="18" height="4" rx="1"/><rect x="3" y="10" width="18" height="4" rx="1"/><rect x="3" y="16" width="18" height="4" rx="1"/>',
    cog: '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
    cloud: '<path d="M7 18a5 5 0 0 1-.6-9.96A6 6 0 0 1 18 9a4.5 4.5 0 0 1-.5 9z"/>',
    box: '<path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5zM3.5 7.5 12 12l8.5-4.5M12 12v9"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    git: '<circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="8" r="2.5"/><path d="M6 8.5v7M18 10.5c0 4-6 3-11 6"/>',
    bot: '<rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 4v4M9 13h.01M15 13h.01M9.5 17h5"/><circle cx="12" cy="3.5" r="1"/>',
    terminal: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9l3 3-3 3M12 15h5"/>',
    plug: '<path d="M9 2v5M15 2v5M6 7h12v3a6 6 0 0 1-12 0zM12 16v6"/>',
    book: '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5zM4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>',
    layers: '<path d="M12 3 2 8l10 5 10-5zM2 12.5l10 5 10-5M2 16.5l10 5 10-5"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    alert: '<path d="M12 3 2 20h20zM12 10v4M12 17h.01"/>',
    message: '<path d="M4 5h16v11H9l-5 4z"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M3 20h18"/>',
    card: '<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 10h19M6 15h4"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    pen: '<path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4"/>',
    split: '<circle cx="12" cy="5" r="2.5"/><circle cx="5" cy="19" r="2.5"/><circle cx="19" cy="19" r="2.5"/><path d="M12 7.5v4M12 11.5 5 16.5M12 11.5l7 5"/>',
    bucket: '<path d="M4 7h16l-1.5 12a2 2 0 0 1-2 1.7H7.5a2 2 0 0 1-2-1.7zM3 7h18M9 4h6"/>',
    grad: '<path d="M2 9l10-5 10 5-10 5zM6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5M22 9v6"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    play: '<path d="M7 4v16l13-8z"/>',
    hook: '<path d="M12 3v10a4 4 0 1 1-4-4"/><circle cx="12" cy="3" r="1"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.6v.4M12 17h.01"/>',
    stop: '<path d="M8 3h8l5 5v8l-5 5H8l-5-5V8z"/><path d="M9 9l6 6M15 9l-6 6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    archive: '<rect x="3" y="4" width="18" height="5" rx="1.5"/><path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9M10 13h4"/>',
    chevron: '<path d="M9 6l6 6-6 6"/>',
  }
  function icon(name) { return ICONS[name] ? '<svg class="dg-i" viewBox="0 0 24 24" aria-hidden="true">' + ICONS[name] + '</svg>' : '' }

  /* ---------- tooltip: any [data-tip], any label cut by an ellipsis, any chart mark ---------- */
  var tip = null
  function showTip(html, ev) {
    if (!tip) { tip = h('div', 'dg-tip'); tip.hidden = true }
    if (!tip.parentNode) document.body.appendChild(tip)
    tip.innerHTML = html
    tip.hidden = false
    var w = tip.offsetWidth, hh = tip.offsetHeight
    var x = ev.clientX + 14, y = ev.clientY + 14
    if (x + w > window.innerWidth - 8) x = ev.clientX - w - 14
    if (y + hh > window.innerHeight - 8) y = ev.clientY - hh - 14
    tip.style.left = Math.max(8, x) + 'px'
    tip.style.top = Math.max(8, y) + 'px'
  }
  function hideTip() { if (tip) tip.hidden = true }
  function hover(el, html) {
    el.addEventListener('pointermove', function (ev) { showTip(typeof html === 'function' ? html(ev) : html, ev) })
    el.addEventListener('pointerleave', hideTip)
  }
  var tipsOn = false
  function startTips() {
    if (tipsOn) return
    tipsOn = true
    document.addEventListener('pointerover', function (ev) {
      var t = ev.target.closest && ev.target.closest('[data-tip], .dg-cut')
      if (!t) return
      if (!t.hasAttribute('data-tip') && t.scrollWidth <= t.clientWidth && t.scrollHeight <= t.clientHeight + 1) return
      var words = t.getAttribute('data-tip') || t.textContent
      var move = function (e) { showTip(esc(words), e) }
      move(ev)
      t.addEventListener('pointermove', move)
      t.addEventListener('pointerleave', function off() { hideTip(); t.removeEventListener('pointermove', move); t.removeEventListener('pointerleave', off) })
    })
  }

  /* a closed path through the points, each corner rounded with radius r */
  function roundPoly(pts, r) {
    var n = pts.length, d = ''
    for (var i = 0; i < n; i++) {
      var p = pts[i], a = pts[(i + n - 1) % n], b = pts[(i + 1) % n]
      var la = Math.hypot(a[0] - p[0], a[1] - p[1]), lb = Math.hypot(b[0] - p[0], b[1] - p[1]), k = Math.min(r, la / 2, lb / 2)
      var s0 = [p[0] + (a[0] - p[0]) / la * k, p[1] + (a[1] - p[1]) / la * k], s1 = [p[0] + (b[0] - p[0]) / lb * k, p[1] + (b[1] - p[1]) / lb * k]
      d += (i ? 'L' : 'M') + s0.join(' ') + 'Q' + p.join(' ') + ' ' + s1.join(' ')
    }
    return d + 'Z'
  }

  /* ---------- the few SVG shapes ---------- */
  var SVG_SHAPES = { diamond: 1, circle: 1, hex: 1, io: 1, db: 1 }
  function shapePaths(shape, w, hh) {
    var i = 1, W = w - 2, H = hh - 2
    switch (shape) {
      case 'circle': return ['M' + (w / 2) + ' ' + i + 'A' + W / 2 + ' ' + H / 2 + ' 0 1 1 ' + (w / 2 - 0.01) + ' ' + i + 'Z']
      case 'diamond': return [roundPoly([[w / 2, i], [w - i, hh / 2], [w / 2, hh - i], [i, hh / 2]], 30)]
      case 'hex': var cut = Math.min(H / 2, 16); return [roundPoly([[i + cut, i], [w - i - cut, i], [w - i, hh / 2], [w - i - cut, hh - i], [i + cut, hh - i], [i, hh / 2]], 14)]
      case 'io': var sk = 13; return [roundPoly([[i + sk, i], [w - i, i], [w - i - sk, hh - i], [i, hh - i]], 18)]
      case 'db':
        var ry = Math.min(8, H / 6)
        return ['M' + i + ' ' + (i + ry) + 'A' + W / 2 + ' ' + ry + ' 0 0 1 ' + (w - i) + ' ' + (i + ry) + 'V' + (hh - i - ry) + 'A' + W / 2 + ' ' + ry + ' 0 0 1 ' + i + ' ' + (hh - i - ry) + 'Z',
          'M' + i + ' ' + (i + ry) + 'A' + W / 2 + ' ' + ry + ' 0 0 0 ' + (w - i) + ' ' + (i + ry)]
    }
    return []
  }

  function nodeHtml(n) {
    if (n.shape === 'table' || n.shape === 'class') return tableHtml(n)
    var parts = []
    if (n.icon) parts.push('<span class="dg-ico">' + icon(n.icon) + '</span>')
    var words = ''
    if (n.kicker) words += '<span class="dg-kicker">' + esc(n.kicker) + '</span>'
    if (n.title) words += '<span class="dg-title">' + esc(n.title) + '</span>'
    if (n.meta) words += '<span class="dg-meta">' + esc(n.meta) + '</span>'
    if (n.tags) words += '<span class="dg-tags">' + n.tags.map(function (t) { return '<span class="dg-tag">' + esc(t) + '</span>' }).join('') + '</span>'
    var status = n.status ? '<span class="dg-status" data-st="' + esc(n.status) + '">' + esc(n.statusText || n.status) + '</span>' : ''
    if (status && n.kicker) { words = words.replace(/^<span class="dg-kicker">.*?<\/span>/, function (k) { return '<span class="dg-kickrow">' + k + status + '</span>' }); status = '' }
    if (words) parts.push('<span class="dg-text">' + words + '</span>')
    if (status) parts.push(status)
    var shape = SVG_SHAPES[n.shape] ? '<svg class="dg-shape" aria-hidden="true"></svg>' : ''
    return shape + '<span class="dg-body">' + parts.join('') + '</span>'
  }
  function tableHtml(n) {
    var head = '<span class="dg-th">' + (n.icon ? icon(n.icon) : '') + '<span class="dg-th__name">' + esc(n.title) + '</span>' + (n.stereo ? '<span class="dg-th__st">' + esc(n.stereo) + '</span>' : '') + '</span>'
    var rows = (n.rows || []).map(function (r) {
      var key = r.key ? '<span class="dg-key" data-k="' + esc(r.key) + '">' + esc(r.key) + '</span>' : '<span class="dg-key"></span>'
      return '<span class="dg-row" data-n="' + esc(n.id + '.' + r.name) + '">' + key + '<span>' + esc(r.name) + '</span><span class="dg-row__type">' + esc(r.type || '') + '</span></span>'
    }).join('')
    var ops = (n.ops || []).length ? '<span class="dg-ops">' + n.ops.map(function (o) { return '<span class="dg-op">' + esc(o) + '</span>' }).join('') + '</span>' : ''
    return head + '<span class="dg-rows">' + rows + '</span>' + ops
  }

  /* ---------- edges ---------- */
  var NORMAL = { r: [1, 0], l: [-1, 0], t: [0, -1], b: [0, 1] }
  var MARK_LEN = { arrow: 8, 'tri-open': 13, diamond: 17, 'diamond-open': 17 }
  function len(kind) { return MARK_LEN[kind] || 0 }
  function rel(el, box) { var r = el.getBoundingClientRect(); return { l: r.left - box.left, t: r.top - box.top, w: r.width, h: r.height } }
  function sidePoint(r, side, f) {
    if (side === 'r') return [r.l + r.w, r.t + r.h * f]
    if (side === 'l') return [r.l, r.t + r.h * f]
    if (side === 't') return [r.l + r.w * f, r.t]
    return [r.l + r.w * f, r.t + r.h]
  }
  function autoSides(A, B) {
    var dx = (B.l + B.w / 2) - (A.l + A.w / 2), dy = (B.t + B.h / 2) - (A.t + A.h / 2)
    if (Math.abs(dx) * 0.8 > Math.abs(dy)) return dx > 0 ? ['r', 'l'] : ['l', 'r']
    return dy > 0 ? ['b', 't'] : ['t', 'b']
  }
  function add(p, n, k) { return [p[0] + n[0] * k, p[1] + n[1] * k] }
  /* two ends a few pixels apart across the direction of travel are one straight line: move `b` onto the line of `a` */
  function snap(a, b, n) {
    var i = n[1] === 0 ? 1 : 0
    if (Math.abs(a[i] - b[i]) < 10) b[i] = a[i]
  }
  /* a path from p0 leaving along n0 to p1, arriving against n1 */
  function route(p0, n0, p1, n1, kind, bend) {
    if (kind === 'elbow') {
      var a = add(p0, n0, 16), b = add(p1, n1, 16), pts = [p0, a]
      var h0 = n0[1] === 0, h1 = n1[1] === 0
      if (h0 && h1) { var mx = (a[0] + b[0]) / 2; pts.push([mx, a[1]], [mx, b[1]]) }
      else if (!h0 && !h1) { var my = (a[1] + b[1]) / 2; pts.push([a[0], my], [b[0], my]) }
      else if (h0) pts.push([b[0], a[1]])
      else pts.push([a[0], b[1]])
      pts.push(b, p1)
      return rounded(pts)
    }
    var dist = Math.abs(p1[0] - p0[0]) * Math.abs(n0[0]) + Math.abs(p1[1] - p0[1]) * Math.abs(n0[1])
    var k = bend ? Math.abs(bend) * 1.35 : Math.max(20, dist / 2)
    var c1 = add(p0, n0, k), c2 = add(p1, n1, k)
    var at = function (i) { return 0.125 * p0[i] + 0.375 * c1[i] + 0.375 * c2[i] + 0.125 * p1[i] }
    return { d: 'M' + p0.join(' ') + 'C' + c1.join(' ') + ',' + c2.join(' ') + ',' + p1.join(' '), mid: [at(0), at(1)] }
  }
  function rounded(pts) {
    var clean = [pts[0]]
    pts.slice(1).forEach(function (p) { var q = clean[clean.length - 1]; if (Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) > 0.5) clean.push(p) })
    var d = 'M' + clean[0].join(' '), total = 0, segs = []
    for (var i = 1; i < clean.length; i++) { var L = Math.hypot(clean[i][0] - clean[i - 1][0], clean[i][1] - clean[i - 1][1]); segs.push(L); total += L }
    for (var j = 1; j < clean.length - 1; j++) {
      var p = clean[j], prev = clean[j - 1], next = clean[j + 1]
      var r = Math.min(16, segs[j - 1] / 2, segs[j] / 2)
      var u = [(prev[0] - p[0]) / segs[j - 1], (prev[1] - p[1]) / segs[j - 1]], v = [(next[0] - p[0]) / segs[j], (next[1] - p[1]) / segs[j]]
      d += 'L' + (p[0] + u[0] * r) + ' ' + (p[1] + u[1] * r) + 'Q' + p[0] + ' ' + p[1] + ' ' + (p[0] + v[0] * r) + ' ' + (p[1] + v[1] * r)
    }
    d += 'L' + clean[clean.length - 1].join(' ')
    var half = total / 2, acc = 0, mid = clean[0]
    for (var m = 1; m < clean.length; m++) {
      if (acc + segs[m - 1] >= half) { var t = (half - acc) / segs[m - 1]; mid = [clean[m - 1][0] + (clean[m][0] - clean[m - 1][0]) * t, clean[m - 1][1] + (clean[m][1] - clean[m - 1][1]) * t]; break }
      acc += segs[m - 1]
    }
    return { d: d, mid: mid }
  }
  /* a mark at `tip`; the line comes in along `dir`, a unit vector pointing into the node */
  function marker(layer, kind, tipP, dir, tn) {
    if (!kind || kind === 'none') return
    var perp = [-dir[1], dir[0]]
    var back = function (k, side) { return [tipP[0] - dir[0] * k + perp[0] * (side || 0), tipP[1] - dir[1] * k + perp[1] * (side || 0)] }
    var P = function (pts) { return 'M' + pts.map(function (p) { return p.join(' ') }).join('L') }
    var g = s('g', { class: 'dg-mark', 'data-tone': tn }, layer)
    var line = function (pts) { s('path', { d: P(pts), class: 'dg-mark__line' }, g) }
    var bar = function (k) { line([back(k, -6), back(k, 6)]) }
    var crow = function () { line([back(12), tipP]); line([back(12), back(0, -6.5)]); line([back(12), back(0, 6.5)]) }
    var ring = function (k) { s('circle', { cx: back(k)[0], cy: back(k)[1], r: 3.5, class: 'dg-mark__open' }, g) }
    switch (kind) {
      case 'arrow': s('path', { d: P([tipP, back(8, -4.5), back(8, 4.5)]) + 'Z', class: 'dg-mark__fill' }, g); break
      case 'tri-open': s('path', { d: P([tipP, back(13, -7), back(13, 7)]) + 'Z', class: 'dg-mark__open' }, g); break
      case 'diamond': s('path', { d: P([tipP, back(8.5, -5.5), back(17), back(8.5, 5.5)]) + 'Z', class: 'dg-mark__fill' }, g); break
      case 'diamond-open': s('path', { d: P([tipP, back(8.5, -5.5), back(17), back(8.5, 5.5)]) + 'Z', class: 'dg-mark__open' }, g); break
      case 'one': bar(9); break
      case 'one-one': bar(7); bar(12); break
      case 'many': crow(); break
      case 'one-many': crow(); bar(17); break
      case 'zero-many': crow(); ring(20); break
      case 'zero-one': bar(8); ring(16); break
    }
  }

  /* ---------- graph ---------- */
  var measure = document.createElement('canvas').getContext('2d')
  /* gaps 1.4 times the spec, and wide enough that each label sits on a line with room at both ends */
  function roomFor(spec) {
    var col = (spec.colGap == null ? 56 : spec.colGap) * 1.4, row = (spec.rowGap == null ? 48 : spec.rowGap) * 1.4
    var at = {}
    spec.nodes.forEach(function (n) { at[n.id] = n.at })
    measure.font = '500 12px "Be Vietnam Pro", system-ui, sans-serif'
    ;(spec.edges || []).forEach(function (e) {
      if (!e.label) return
      var a = at[e.from.split('.')[0]], b = at[e.to.split('.')[0]]
      if (!a || !b) return
      var need = measure.measureText(e.label).width + 16 + 56
      if (a[0] === b[0] || e.a === 'r' || e.a === 'l') col = Math.max(col, need)
      else row = Math.max(row, 64)
    })
    return [col, row]
  }
  function renderGraph(el, spec) {
    var scroll = h('div', 'dg-scroll')
    var canvas = h('div', 'dg-canvas')
    canvas.style.gridTemplateColumns = typeof spec.cols === 'number' ? 'repeat(' + spec.cols + ', minmax(max-content, 1fr))' : spec.cols
    var gaps = roomFor(spec)
    canvas.style.columnGap = gaps[0] + 'px'
    canvas.style.rowGap = gaps[1] + 'px'
    var gpad = Math.max.apply(null, [0].concat((spec.groups || []).map(function (g) { return (g.pad == null ? 16 : g.pad) * 1.4 })))
    canvas.style.padding = gpad ? (gpad + 30) + 'px ' + (gpad + 16) + 'px ' + (gpad + 16) + 'px' : (spec.pad || '24px 18px')
    if (spec.rows) canvas.style.gridTemplateRows = spec.rows
    ;(spec.groups || []).forEach(function (g) {
      var box = h('div', 'dg-group')
      box.style.gridArea = g.at[0] + ' / ' + g.at[1] + ' / ' + (g.at[2] + 1) + ' / ' + (g.at[3] + 1)
      box.style.setProperty('--gpad', (g.pad == null ? 16 : g.pad) * 1.4 + 'px')
      if (g.tone) box.setAttribute('data-tone', g.tone)
      box.setAttribute('data-style', g.style || 'dashed')
      box.innerHTML = '<span class="dg-group__label">' + (g.icon ? icon(g.icon) : '') + '<span class="dg-cut">' + esc(g.label) + '</span></span>'
      canvas.appendChild(box)
    })
    spec.nodes.forEach(function (n) {
      var node = h('div', 'dg-node', nodeHtml(n))
      node.setAttribute('data-n', n.id)
      node.setAttribute('data-shape', n.shape || 'rect')
      if (SVG_SHAPES[n.shape]) node.setAttribute('data-svg', '')
      if (n.tone) node.setAttribute('data-tone', n.tone)
      if (n.fill) node.setAttribute('data-fill', n.fill)
      if (n.line) node.setAttribute('data-line', n.line)
      if (n.size) node.setAttribute('data-size', n.size)
      if (n.hl) node.setAttribute('data-hl', '')
      var span = n.span || [1, 1]
      node.style.gridArea = n.at[0] + ' / ' + n.at[1] + ' / span ' + span[0] + ' / span ' + span[1]
      node.style.justifySelf = n.justify || spec.justify || 'center'
      if (n.align) node.style.alignSelf = n.align
      if (n.w) { node.style.width = n.w + 'px'; node.setAttribute('data-w', '') }
      if (n.tip) node.setAttribute('data-tip', n.tip)
      canvas.appendChild(node)
    })
    var layer = s('svg', { class: 'dg-edges', 'aria-hidden': 'true' })
    canvas.appendChild(layer)
    scroll.appendChild(canvas)
    el.appendChild(scroll)
    return function () { drawGraph(canvas, layer, spec) }
  }
  function drawGraph(canvas, layer, spec) {
    var box = canvas.getBoundingClientRect()
    if (!box.width) return
    canvas.querySelectorAll('.dg-node[data-svg]').forEach(function (node) {
      var svgEl = node.querySelector(':scope > .dg-shape'), w = node.offsetWidth, hh = node.offsetHeight
      svgEl.setAttribute('viewBox', '0 0 ' + w + ' ' + hh)
      svgEl.innerHTML = ''
      shapePaths(node.getAttribute('data-shape'), w, hh).forEach(function (d, i) { s('path', { d: d, class: i ? 'dg-shape__line' : 'dg-shape__fill' }, svgEl) })
    })
    canvas.querySelectorAll('.dg-elabel').forEach(function (l) { l.remove() })
    layer.innerHTML = ''
    var rects = {}
    canvas.querySelectorAll('[data-n]').forEach(function (n) { rects[n.getAttribute('data-n')] = rel(n, box) })
    var edges = (spec.edges || []).map(function (e, i) {
      var A = rects[e.from], B = rects[e.to]
      if (!A || !B) return null
      var sides = autoSides(A, B)
      return Object.assign({ i: i, A: A, B: B, a: e.a || sides[0], b: e.b || sides[1], fa: 0.5, fb: 0.5 }, e)
    }).filter(Boolean)
    /* edges that share a side of a node spread along it, unless they merge or split there */
    var groups = {}
    edges.forEach(function (e) {
      if (!e.split) (groups[e.from + ':' + e.a] = groups[e.from + ':' + e.a] || []).push({ e: e, end: 'fa', other: e.B, side: e.a })
      if (!e.merge) (groups[e.to + ':' + e.b] = groups[e.to + ':' + e.b] || []).push({ e: e, end: 'fb', other: e.A, side: e.b })
    })
    Object.keys(groups).forEach(function (k) {
      var g = groups[k], vertical = g[0].side === 'l' || g[0].side === 'r', n = g.length
      g.sort(function (p, q) { return vertical ? (p.other.t + p.other.h / 2) - (q.other.t + q.other.h / 2) : (p.other.l + p.other.w / 2) - (q.other.l + q.other.w / 2) })
      var step = Math.min(1 / (n + 1), 0.18)
      g.forEach(function (it, j) { it.e[it.end] = 0.5 + (j - (n - 1) / 2) * step })
    })
    var merges = {}, splits = {}
    edges.forEach(function (e) {
      if (e.merge) (merges[e.to + ':' + e.b] = merges[e.to + ':' + e.b] || []).push(e)
      if (e.split) (splits[e.from + ':' + e.a] = splits[e.from + ':' + e.a] || []).push(e)
    })
    var kindOf = function (e) { return e.route || spec.route || 'curve' }
    var pathEl = function (d, e) {
      s('path', { d: d, class: 'dg-e' + (e.main ? ' dg-e--main' : '') + (e.dash ? ' dg-e--dash' : '') + (e.flow ? ' dg-e--flow' : ''), 'data-tone': e.tone }, layer)
    }
    var label = function (e, at) {
      if (!e.label) return
      var l = h('span', 'dg-elabel', esc(e.label))
      if (e.tone) l.setAttribute('data-tone', e.tone)
      l.style.left = at[0] + 'px'
      l.style.top = (at[1] + (e.labelDy || 0)) + 'px'
      canvas.appendChild(l)
    }
    var drawn = {}
    /* lines into one side of a node join smoothly on a short shared stem, which carries the one arrow */
    Object.keys(merges).forEach(function (k) {
      var g = merges[k]
      if (g.length < 2) return
      var e0 = g[0], nb = NORMAL[e0.b], tipP = sidePoint(e0.B, e0.b, 0.5)
      var end = add(tipP, nb, len(e0.end || 'arrow')), J = add(end, nb, 22)
      g.forEach(function (e) {
        var p0 = sidePoint(e.A, e.a, e.fa)
        snap(J, p0, nb)
        pathEl(route(p0, NORMAL[e.a], J, nb, kindOf(e), e.bend).d + 'L' + end.join(' '), e)
        drawn[e.i] = 1
      })
      marker(layer, e0.end || 'arrow', tipP, [-nb[0], -nb[1]], e0.tone)
      label(e0, add(J, nb, 14))
    })
    Object.keys(splits).forEach(function (k) {
      var g = splits[k]
      if (g.length < 2) return
      var e0 = g[0], na = NORMAL[e0.a], p0 = sidePoint(e0.A, e0.a, 0.5), J = add(p0, na, 22)
      g.forEach(function (e) {
        var tipP = sidePoint(e.B, e.b, e.fb), nb = NORMAL[e.b]
        snap(J, tipP, na)
        var end = add(tipP, nb, len(e.end || 'arrow'))
        var r = route(J, na, end, nb, kindOf(e), e.bend)
        pathEl('M' + p0.join(' ') + 'L' + J.join(' ') + r.d.replace(/^M[^A-Za-z]*/, ''), e)
        marker(layer, e.end || 'arrow', tipP, [-nb[0], -nb[1]], e.tone)
        label(e, r.mid)
        drawn[e.i] = 1
      })
    })
    edges.forEach(function (e) {
      if (drawn[e.i]) return
      var na = NORMAL[e.a], nb = NORMAL[e.b]
      var startTip = sidePoint(e.A, e.a, e.fa), tipP = sidePoint(e.B, e.b, e.fb)
      if (na[0] === -nb[0] && na[1] === -nb[1]) snap(startTip, tipP, na)
      var p0 = add(startTip, na, len(e.start)), end = add(tipP, nb, len(e.end || 'arrow'))
      var r = route(p0, na, end, nb, kindOf(e), e.bend)
      pathEl(r.d, e)
      marker(layer, e.end || 'arrow', tipP, [-nb[0], -nb[1]], e.tone)
      marker(layer, e.start, startTip, [-na[0], -na[1]], e.tone)
      label(e, r.mid)
    })
  }

  /* ---------- sequence ---------- */
  function renderSequence(el, spec, W) {
    var P = spec.parts, n = P.length
    var scroll = h('div', 'dg-scroll')
    el.appendChild(scroll)
    var svgEl = s('svg', { width: W, class: 'dg-seq__svg' }, scroll)
    var back = s('g', {}, svgEl), mid = s('g', {}, svgEl), front = s('g', {}, svgEl)
    var textW = function (t, cls) { var m = s('text', { class: cls, x: -9999, y: -9999 }, front); m.textContent = t; var w = m.getComputedTextLength(); m.remove(); return w }
    /* a column is wide enough for its head and for the labels that cross it, up to a cap; a longer label wraps */
    var index = {}
    P.forEach(function (p, i) { index[p.id] = i })
    var colW = Math.max(176, (W - 20) / n)
    P.forEach(function (p) { colW = Math.max(colW, textW(p.label, 'dg-seq__head') + 90) })
    spec.steps.forEach(function (st) {
      if (!st.label) return
      var span = Math.max(1, Math.abs(index[st.to] - index[st.from]))
      colW = Math.max(colW, (textW(st.label, 'dg-seq__label') + (st.reply ? 0 : 22) + 18 + 36) / span)
    })
    colW = Math.min(colW, 300)
    var width = colW * n
    svgEl.setAttribute('width', width)
    var X = {}, tones = {}
    P.forEach(function (p, i) { X[p.id] = colW * (i + 0.5); tones[p.id] = p.tone })
    var headH = 44, top = headH + 14, y = top + 14
    var active = {}, bars = [], frames = [], stack = [], num = 0
    /* the words of a label in lines no wider than max */
    var wrap = function (words, max) {
      var lines = [], line = ''
      words.split(' ').forEach(function (w) {
        var next = line ? line + ' ' + w : w
        if (line && textW(next, 'dg-seq__label') > max) { lines.push(line); line = w } else line = next
      })
      if (line) lines.push(line)
      return lines
    }
    var spanX = function (ids) { var xs = ids.map(function (id) { return X[id] }); return [Math.min.apply(null, xs), Math.max.apply(null, xs)] }
    spec.steps.forEach(function (st) {
      if (st.frame) {
        y += 22
        var sx = spanX(st.over || P.map(function (p) { return p.id }))
        stack.push({ kind: st.frame, cond: st.cond || '', x1: sx[0] - 72, x2: sx[1] + 72, y0: y - 8, divs: [] })
        y += 14
        return
      }
      if (st.else !== undefined) { y += 14; stack[stack.length - 1].divs.push({ y: y, cond: st.else }); y += 16; return }
      if (st.end) { y += 16; var f = stack.pop(); f.y1 = y; frames.push(f); y += 6; return }
      if (st.note) {
        y += 16
        var nx = spanX(st.over || [st.from]), cx = (nx[0] + nx[1]) / 2
        var half = Math.max((nx[1] - nx[0]) / 2 + 40, textW(st.note, 'dg-seq__notetext') / 2 + 14)
        s('rect', { x: cx - half, y: y, width: half * 2, height: 28, rx: 14, class: 'dg-seq__note' }, front)
        var nt = s('text', { x: cx, y: y + 18.5, 'text-anchor': 'middle', class: 'dg-seq__notetext' }, front)
        nt.textContent = st.note
        y += 30
        return
      }
      num += 1
      var from = X[st.from], to = X[st.to], self = st.from === st.to
      var badgeW = st.reply ? 0 : 22
      var room = (self ? colW - 70 : Math.abs(to - from) - 36) - badgeW - 18
      var lines = wrap(st.label, room)
      var lw = Math.max.apply(null, lines.map(function (l) { return textW(l, 'dg-seq__label') }))
      var chipW = lw + badgeW + 18, chipH = 20 + (lines.length - 1) * 16
      y += (self ? 34 : 40) + (lines.length - 1) * 16
      if (!st.reply && !self && !active[st.to]) active[st.to] = { y: y - 8, tone: tones[st.to] }
      var off = function (id) { return active[id] ? 4.5 : 0 }
      var g = s('g', { class: 'dg-seq__msg' + (st.reply ? ' is-reply' : ''), 'data-tone': st.tone }, front)
      if (self) {
        var sx0 = from + off(st.from)
        s('path', { d: 'M' + sx0 + ' ' + (y - 10) + 'H' + (sx0 + 26) + 'Q' + (sx0 + 36) + ' ' + (y - 10) + ' ' + (sx0 + 36) + ' ' + y + 'Q' + (sx0 + 36) + ' ' + (y + 10) + ' ' + (sx0 + 26) + ' ' + (y + 10) + 'H' + (sx0 + 8), class: 'dg-seq__line' }, g)
        marker(g, 'arrow', [sx0, y + 10], [-1, 0], st.tone)
        chip(g, sx0 + 46, y - 11 - (chipH - 20) / 2, chipW, lines, st.reply ? 0 : num)
        y += 10
      } else {
        var dir = to > from ? 1 : -1
        var a = from + dir * off(st.from), tipX = to - dir * off(st.to)
        s('path', { d: 'M' + a + ' ' + y + 'L' + (tipX - dir * 8) + ' ' + y, class: 'dg-seq__line' }, g)
        marker(g, 'arrow', [tipX, y], [dir, 0], st.tone)
        chip(g, (a + tipX) / 2 - chipW / 2, y - 6 - chipH, chipW, lines, st.reply ? 0 : num)
      }
      if (st.reply && active[st.from]) { bars.push({ x: from, y0: active[st.from].y, y1: y + 6, tone: active[st.from].tone }); delete active[st.from] }
    })
    Object.keys(active).forEach(function (id) { bars.push({ x: X[id], y0: active[id].y, y1: y + 10, tone: active[id].tone }) })
    var bottom = y + 26
    P.forEach(function (p) { s('line', { x1: X[p.id], x2: X[p.id], y1: top, y2: bottom, class: 'dg-seq__life' }, back) })
    bars.forEach(function (b) { s('rect', { x: b.x - 4.5, y: b.y0, width: 9, height: b.y1 - b.y0, rx: 3, class: 'dg-seq__act', 'data-tone': b.tone }, back) })
    frames.forEach(function (f) {
      s('rect', { x: f.x1, y: f.y0, width: f.x2 - f.x1, height: f.y1 - f.y0, rx: 12, class: 'dg-seq__frame' }, back)
      var tagText = f.kind.toUpperCase() + '  ' + f.cond
      var tw = textW(tagText, 'dg-seq__tag')
      s('rect', { x: f.x1 + 12, y: f.y0 - 8, width: tw + 16, height: 16, class: 'dg-seq__tagbg' }, mid)
      var t = s('text', { x: f.x1 + 20, y: f.y0 + 4, class: 'dg-seq__tag' }, mid)
      t.textContent = tagText
      f.divs.forEach(function (d) {
        s('line', { x1: f.x1, x2: f.x2, y1: d.y, y2: d.y, class: 'dg-seq__div' }, back)
        var dw = textW('ELSE  ' + d.cond, 'dg-seq__tag')
        s('rect', { x: f.x1 + 12, y: d.y - 8, width: dw + 16, height: 16, class: 'dg-seq__tagbg' }, mid)
        var dt = s('text', { x: f.x1 + 20, y: d.y + 4, class: 'dg-seq__tag' }, mid)
        dt.textContent = 'ELSE  ' + d.cond
      })
    })
    P.forEach(function (p) {
      var g = s('g', { class: 'dg-seq__part', 'data-tone': p.tone }, front)
      var lw = textW(p.label, 'dg-seq__head'), wHead = lw + 58, x0 = X[p.id] - wHead / 2
      s('rect', { x: x0, y: 2, width: wHead, height: headH, rx: 14, class: 'dg-seq__card' }, g)
      s('rect', { x: x0 + 9, y: 2 + headH / 2 - 13, width: 26, height: 26, rx: 8, class: 'dg-seq__tile' }, g)
      var ic = s('g', { transform: 'translate(' + (x0 + 14) + ' ' + (2 + headH / 2 - 8) + ') scale(.6667)', class: 'dg-seq__icon' }, g)
      ic.innerHTML = ICONS[p.icon] || ICONS.box
      var label = s('text', { x: x0 + 43, y: 2 + headH / 2 + 4.5, class: 'dg-seq__head' }, g)
      label.textContent = p.label
    })
    svgEl.setAttribute('height', bottom + 4)
    svgEl.setAttribute('viewBox', '0 0 ' + width + ' ' + (bottom + 4))
  }
  /* a label chip: one line or more, with the call number in front */
  function chip(g, x, y, w, lines, n) {
    var hgt = 20 + (lines.length - 1) * 16
    s('rect', { x: x, y: y, width: w, height: hgt, rx: 10, class: 'dg-seq__chip' }, g)
    var tx = x + 9
    if (n) {
      s('circle', { cx: x + 12, cy: y + 10, r: 7, class: 'dg-seq__badge' }, g)
      var b = s('text', { x: x + 12, y: y + 13.5, 'text-anchor': 'middle', class: 'dg-seq__badgetext' }, g)
      b.textContent = n
      tx = x + 25
    }
    lines.forEach(function (line, i) {
      var t = s('text', { x: tx, y: y + 14 + i * 16, class: 'dg-seq__label' }, g)
      t.textContent = line
    })
  }

  /* ---------- mind map: pills placed by measuring them ---------- */
  var BRANCH = ['primary', 'success', 'warning', 'violet', 'danger', 'aqua']
  function renderMind(el, spec) {
    var scroll = h('div', 'dg-scroll'), wrap = h('div', 'dg-mind')
    scroll.appendChild(wrap)
    el.appendChild(scroll)
    var root = JSON.parse(JSON.stringify(spec.root)), all = []
    var make = function (node, depth, tn) {
      node.depth = depth
      node.tone = node.tone || tn
      var e = h('span', 'dg-mind__n', esc(node.t))
      e.setAttribute('data-d', Math.min(depth, 3))
      if (node.tone) e.setAttribute('data-tone', node.tone)
      wrap.appendChild(e)
      node.el = e
      all.push(node)
      ;(node.c || []).forEach(function (c, i) { make(c, depth + 1, depth === 0 ? BRANCH[i % BRANCH.length] : node.tone) })
    }
    make(root, 0, null)
    root.c = root.c || []
    all.forEach(function (n) { n.w = n.el.offsetWidth; n.h = n.el.offsetHeight })
    var GAP = 12, COL = 38
    var height = function (n) { n.H = n.c && n.c.length ? Math.max(n.h + GAP, n.c.reduce(function (a, c) { return a + height(c) }, 0)) : n.h + GAP; return n.H }
    root.c.forEach(height)
    var right = [], left = [], hr = 0, hl = 0
    root.c.forEach(function (c) { if (spec.layout === 'right' || hr <= hl) { right.push(c); hr += c.H } else { left.push(c); hl += c.H } })
    var place = function (n, x, yTop, dir) {
      n.dir = dir
      n.y = yTop + n.H / 2
      n.x = dir > 0 ? x : x - n.w
      var cx = dir > 0 ? n.x + n.w + COL : n.x - COL, cy = yTop
      ;(n.c || []).forEach(function (c) { place(c, cx, cy, dir); cy += c.H })
    }
    var total = Math.max(hr, hl, root.h)
    root.x = -root.w / 2
    root.y = total / 2
    var cy = total / 2 - hr / 2
    right.forEach(function (c) { place(c, root.w / 2 + 48, cy, 1); cy += c.H })
    cy = total / 2 - hl / 2
    left.forEach(function (c) { place(c, -root.w / 2 - 48, cy, -1); cy += c.H })
    var minX = Math.min.apply(null, all.map(function (a) { return a.x })), maxX = Math.max.apply(null, all.map(function (a) { return a.x + a.w }))
    var W = maxX - minX + 8, H = total + 8
    wrap.style.width = W + 'px'
    wrap.style.height = H + 'px'
    var svgEl = s('svg', { class: 'dg-mind__edges', viewBox: '0 0 ' + W + ' ' + H }, null)
    wrap.insertBefore(svgEl, wrap.firstChild)
    var X = function (x) { return x - minX + 4 }, Y = function (y) { return y + 4 }
    all.forEach(function (n) {
      n.el.style.left = X(n.x) + 'px'
      n.el.style.top = Y(n.y) + 'px'
      ;(n.c || []).forEach(function (c) {
        var from = [X(c.dir > 0 ? n.x + n.w : n.x), Y(n.y)], to = [X(c.dir > 0 ? c.x : c.x + c.w), Y(c.y)]
        var mx = (from[0] + to[0]) / 2
        s('path', { d: 'M' + from.join(' ') + 'C' + mx + ' ' + from[1] + ',' + mx + ' ' + to[1] + ',' + to.join(' '), class: 'dg-mind__edge', 'data-tone': c.tone, 'stroke-width': c.depth === 1 ? 2 : 1.5 }, svgEl)
      })
    })
  }

  /* ---------- links: pills placed by a small force layout ---------- */
  function renderForce(el, spec, W) {
    var H = spec.height || 440, N = spec.nodes.map(function (n) { return Object.assign({}, n) }), L = spec.links
    var scroll = h('div', 'dg-scroll'), wrap = h('div', 'dg-force')
    W = Math.max(W, 640)
    wrap.style.width = W + 'px'
    wrap.style.height = H + 'px'
    scroll.appendChild(wrap)
    el.appendChild(scroll)
    var idx = {}
    N.forEach(function (n, i) { idx[n.id] = i; n.deg = 0 })
    L.forEach(function (l) { N[idx[l[0]]].deg++; N[idx[l[1]]].deg++ })
    var pills = N.map(function (n) {
      var p = h('span', 'dg-force__n', esc(n.label))
      p.setAttribute('data-tone', n.tone || 'primary')
      p.style.setProperty('--dot', (6 + Math.min(n.deg, 6)) + 'px')
      if (n.deg >= 5) p.setAttribute('data-big', '')
      p.setAttribute('data-tip', n.label + ' · ' + n.deg + ' link' + (n.deg === 1 ? '' : 's'))
      wrap.appendChild(p)
      return p
    })
    var size = pills.map(function (p) { return [p.offsetWidth, p.offsetHeight] })
    var P = N.map(function (n, i) { var a = i / N.length * Math.PI * 2; return { x: W / 2 + Math.cos(a) * W * 0.28, y: H / 2 + Math.sin(a) * H * 0.3, vx: 0, vy: 0 } })
    for (var it = 0; it < 500; it++) {
      for (var i = 0; i < N.length; i++) for (var j = i + 1; j < N.length; j++) {
        var dx = P[j].x - P[i].x, dy = P[j].y - P[i].y, d2 = dx * dx + dy * dy + 0.01, d = Math.sqrt(d2), f = 3800 / d2
        P[i].vx -= dx / d * f; P[i].vy -= dy / d * f; P[j].vx += dx / d * f; P[j].vy += dy / d * f
      }
      L.forEach(function (l) {
        var a = P[idx[l[0]]], b = P[idx[l[1]]], dx = b.x - a.x, dy = b.y - a.y, d = Math.sqrt(dx * dx + dy * dy) + 0.01, f = (d - 120) * 0.025
        a.vx += dx / d * f; a.vy += dy / d * f; b.vx -= dx / d * f; b.vy -= dy / d * f
      })
      P.forEach(function (p, k) {
        p.vx += (W / 2 - p.x) * 0.004; p.vy += (H / 2 - p.y) * 0.01
        p.x += Math.max(-10, Math.min(10, p.vx)); p.y += Math.max(-10, Math.min(10, p.vy))
        p.vx *= 0.8; p.vy *= 0.8
        p.x = Math.max(size[k][0] / 2 + 6, Math.min(W - size[k][0] / 2 - 6, p.x)); p.y = Math.max(size[k][1] / 2 + 6, Math.min(H - size[k][1] / 2 - 6, p.y))
      })
    }
    /* pills must not overlap: push apart the pairs whose boxes touch */
    for (var pass = 0; pass < 60; pass++) {
      for (var a = 0; a < N.length; a++) for (var b = a + 1; b < N.length; b++) {
        var ox = (size[a][0] + size[b][0]) / 2 + 8 - Math.abs(P[b].x - P[a].x), oy = (size[a][1] + size[b][1]) / 2 + 6 - Math.abs(P[b].y - P[a].y)
        if (ox > 0 && oy > 0) {
          if (ox < oy) { var sx = (P[b].x > P[a].x ? 1 : -1) * ox / 2; P[a].x -= sx; P[b].x += sx }
          else { var sy = (P[b].y > P[a].y ? 1 : -1) * oy / 2; P[a].y -= sy; P[b].y += sy }
        }
      }
    }
    var svgEl = s('svg', { class: 'dg-force__edges', viewBox: '0 0 ' + W + ' ' + H })
    wrap.insertBefore(svgEl, wrap.firstChild)
    var lines = L.map(function (l) { var a = P[idx[l[0]]], b = P[idx[l[1]]]; return s('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: 'dg-force__link' }, svgEl) })
    pills.forEach(function (p, i) {
      p.style.left = P[i].x + 'px'
      p.style.top = P[i].y + 'px'
      p.addEventListener('pointerenter', function () {
        var near = {}
        near[N[i].id] = 1
        L.forEach(function (l, k) { var on = l[0] === N[i].id || l[1] === N[i].id; if (on) { near[l[0]] = 1; near[l[1]] = 1 } lines[k].classList.toggle('is-on', on); lines[k].classList.toggle('is-off', !on) })
        pills.forEach(function (o, k) { o.classList.toggle('is-off', !near[N[k].id]) })
      })
      p.addEventListener('pointerleave', function () { lines.forEach(function (l) { l.classList.remove('is-on', 'is-off') }); pills.forEach(function (o) { o.classList.remove('is-off') }) })
    })
  }

  /* ---------- tree: folders open by default, files in mono ---------- */
  function treeRow(n) {
    var leaf = !(n.children && n.children.length)
    var isFile = n.icon ? n.icon === 'file' : leaf
    var code = n.code == null ? isFile : n.code
    var name = code ? '<code class="dg-tree__name">' + esc(n.name) + '</code>' : '<b class="dg-tree__name">' + esc(n.name) + '</b>'
    var note = n.note ? '<span class="dg-tree__note">' + esc(n.note) + '</span>' : ''
    var badge = n.badge ? '<small' + tone(n.badge.tone || 'neutral') + '>' + esc(n.badge.text) + '</small>' : ''
    var chev = '<span class="dg-chev' + (leaf ? ' dg-chev--leaf' : '') + '">' + (leaf ? '' : icon('chevron')) + '</span>'
    var title = n.note ? ' title="' + esc(n.note) + '"' : ''
    return '<span class="bn-tree__row"' + title + '>' + chev + '<span class="bn-icon">' + icon(n.icon || (isFile ? 'file' : 'folder')) + '</span>' + name + note + badge + '</span>'
  }
  function treeItems(list) {
    return '<ul>' + list.map(function (n) {
      if (!(n.children && n.children.length)) return '<li>' + treeRow(n) + '</li>'
      return '<li><details' + (n.open === false ? '' : ' open') + '><summary>' + treeRow(n) + '</summary>' + treeItems(n.children) + '</details></li>'
    }).join('') + '</ul>'
  }
  function renderTree(el, spec) {
    el.appendChild(h('div', 'bn-tree dg-tree', treeItems(spec.items)))
  }

  /* ---------- timeline: events on a rail, milestones on a line, or a feed ---------- */
  function eventHtml(ev) {
    if (ev.day) return '<li class="tl-day">' + esc(ev.day) + '</li>'
    var body = '<b class="tl-title">' + esc(ev.title) + '</b>'
    if (ev.text) body += '<p>' + esc(ev.text) + '</p>'
    if (ev.chips) body += '<div class="tl-chips">' + ev.chips.map(function (c) { return '<span class="dg-tag">' + esc(c) + '</span>' }).join('') + '</div>'
    if (ev.meter) body += '<div class="tl-meter">' + meterHtml(ev.meter, ev.tone) + '</div>'
    return '<li class="tl-ev"' + tone(ev.tone) + '><time class="tl-time">' + esc(ev.time || '') + '</time><span class="tl-ico">' + icon(ev.icon || 'clock') + '</span><div class="tl-card">' + body + '</div></li>'
  }
  function meterHtml(m, tn) {
    var share = m.max ? Math.max(0, Math.min(1, m.value / m.max)) : 0
    var words = m.text || (m.value + '/' + m.max)
    return '<span class="bn-progress"' + tone(m.tone || tn || 'success') + '><span style="--v: ' + Math.round(share * 100) + '%"></span></span><span>' + esc(words) + '</span>'
  }
  function renderEvents(el, spec) {
    var side = spec.time === 'right' ? 'right' : 'left'
    var list = h('ol', 'tl', spec.items.map(eventHtml).join(''))
    list.setAttribute('data-time', side)
    if (spec.switch) {
      var sw = h('div', 'tl-switch', '<button type="button" data-tl="left">Time on the left</button><button type="button" data-tl="right">Time on the right</button>')
      sw.setAttribute('role', 'group')
      sw.setAttribute('aria-label', 'Where the time sits')
      sw.querySelectorAll('button').forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.getAttribute('data-tl') === side))
        b.addEventListener('click', function () {
          list.setAttribute('data-time', b.getAttribute('data-tl'))
          sw.querySelectorAll('button').forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)) })
        })
      })
      el.appendChild(sw)
    }
    el.appendChild(list)
  }
  /* the green runs to halfway past the last done milestone, the blue to the milestone that is now */
  function milestoneLine(items) {
    var n = items.length, at = function (i) { return ((i + 0.5) / n * 100 - 8) / 84 * 100 }
    var lastDone = -1, now = -1
    items.forEach(function (m, i) { if (m.state === 'done') lastDone = i; if (m.state === 'now') now = i })
    var done = lastDone < 0 ? 0 : lastDone === n - 1 ? 100 : (at(lastDone) + at(lastDone + 1)) / 2
    var nowEnd = now < 0 ? done : Math.max(done, at(now))
    return '--ms-done: ' + done.toFixed(1) + '%; --ms-now: ' + nowEnd.toFixed(1) + '%'
  }
  function renderMilestones(el, spec) {
    var items = spec.items
    var html = items.map(function (m) {
      var state = m.state ? ' data-state="' + esc(m.state) + '"' : ''
      var ic = m.icon || (m.state === 'done' ? 'check' : m.state === 'now' ? 'play' : 'flag')
      return '<li class="ms-item"' + state + '><span class="ms-date">' + esc(m.date || '') + '</span><span class="ms-dot">' + icon(ic) + '</span><div class="ms-card"><b>' + esc(m.title) + '</b>' + (m.text ? '<span>' + esc(m.text) + '</span>' : '') + '</div></li>'
    }).join('')
    var list = h('ol', 'ms', html)
    list.style.cssText = 'grid-template-columns: repeat(' + items.length + ', minmax(160px, 1fr)); min-width: ' + Math.max(170 * items.length, 340) + 'px; ' + milestoneLine(items)
    var scroll = h('div', 'dg-scroll')
    scroll.appendChild(list)
    el.appendChild(scroll)
  }
  function renderFeed(el, spec) {
    el.appendChild(h('ul', 'feed', spec.items.map(function (f) {
      return '<li><span class="feed-ico">' + icon(f.icon || 'git') + '</span>' + (f.code ? '<code>' + esc(f.code) + '</code>' : '<span></span>') + '<span class="feed-msg">' + esc(f.text) + '</span><time>' + esc(f.time || '') + '</time></li>'
    }).join('')))
  }
  function renderTimeline(el, spec) {
    if (spec.style === 'milestones') return renderMilestones(el, spec)
    if (spec.style === 'feed') return renderFeed(el, spec)
    renderEvents(el, spec)
  }

  /* ---------- board: one column for each state that holds items, the empty states in a panel at the end ---------- */
  function cardHtml(c) {
    var top = '<div class="bd-top"><span class="bd-id">' + esc(c.id || '') + '</span>'
    if (c.kind) top += '<span class="bd-kind"' + tone(c.kindTone) + '>' + icon(c.kindIcon) + esc(c.kind) + '</span>'
    if (c.size) top += '<span class="bd-size">' + esc(c.size) + '</span>'
    top += '</div>'
    var html = top + '<h4 class="bd-title dg-cut">' + esc(c.title) + '</h4>'
    if (c.note) html += '<p class="bd-note">' + icon(c.noteIcon || 'link') + esc(c.note) + '</p>'
    if (c.areas) html += '<div class="bd-areas">' + c.areas.map(function (a) { return '<span' + tone(a.tone) + '>' + esc(a.name) + '</span>' }).join('') + '</div>'
    if (c.meter) html += '<div class="bd-meter">' + meterHtml(c.meter, c.flag === 'fail' ? 'danger' : 'success') + '</div>'
    var foot = (c.foot || []).map(function (f) {
      var cls = f.kind === 'wait' ? 'bd-wait' : f.kind === 'fail' ? 'bd-fail' : f.kind === 'rank' ? 'bd-rank' : ''
      return '<span' + (cls ? ' class="' + cls + '"' : '') + '>' + icon(f.icon) + esc(f.text) + '</span>'
    }).join('')
    if (c.auto) foot += '<span class="bd-auto">' + esc(c.auto === true ? 'auto' : c.auto) + '</span>'
    if (foot) html += '<div class="bd-foot">' + foot + '</div>'
    return '<article class="bd-card"' + (c.flag ? ' data-flag="' + esc(c.flag) + '"' : '') + '>' + html + '</article>'
  }
  function renderBoard(el, spec) {
    var cols = spec.columns, rest = spec.rest || []
    var html = cols.map(function (col) {
      var cards = col.cards || []
      var body = cards.length ? cards.map(cardHtml).join('') : '<p class="bd-empty">' + icon('archive') + esc(spec.emptyText || 'No items') + '</p>'
      return '<div class="bd-col"' + tone(col.tone) + '><div class="bd-col__head"><span class="bd-dot"></span>' + esc(col.title) + '<span class="bd-count">' + cards.length + '</span></div><div class="bd-col__body">' + body + '</div></div>'
    }).join('')
    if (rest.length) {
      html += '<div class="bd-rest"><div class="bd-rest__head">' + esc(spec.restTitle || 'No items') + '</div><ul>' + rest.map(function (r) {
        return '<li><span class="bd-dot"' + tone(r.tone) + '></span>' + esc(r.title) + '<span class="bd-count">' + (r.count || 0) + '</span></li>'
      }).join('') + '</ul></div>'
    }
    var board = h('div', 'bd', html)
    board.style.gridTemplateColumns = 'repeat(' + cols.length + ', minmax(' + (spec.colWidth || 250) + 'px, 1fr))' + (rest.length ? ' 170px' : '')
    board.style.setProperty('--bd-col-h', (spec.colHeight || 560) + 'px')
    var scroll = h('div', 'dg-scroll')
    scroll.appendChild(board)
    el.appendChild(scroll)
  }

  /* ---------- charts ---------- */
  function niceMax(v, step) { return Math.max(step, Math.ceil(v / step) * step) }
  /* a bar that is round at its free end and flat on the baseline */
  function columnPath(x, y, w, hh, r) {
    r = Math.min(r, w / 2, hh)
    return 'M' + x + ' ' + (y + hh) + 'V' + (y + r) + 'Q' + x + ' ' + y + ' ' + (x + r) + ' ' + y + 'H' + (x + w - r) + 'Q' + (x + w) + ' ' + y + ' ' + (x + w) + ' ' + (y + r) + 'V' + (y + hh) + 'Z'
  }
  /* an arc of a ring between two angles, in radians from twelve o'clock, clockwise */
  function arc(cx, cy, r, a0, a1) {
    var p = function (a) { return [cx + r * Math.sin(a), cy - r * Math.cos(a)] }
    var s0 = p(a0), s1 = p(a1)
    return 'M' + s0[0] + ' ' + s0[1] + 'A' + r + ' ' + r + ' 0 ' + (a1 - a0 > Math.PI ? 1 : 0) + ' 1 ' + s1[0] + ' ' + s1[1]
  }
  function chartBox(el, spec, cls) {
    var box = h('div', 'dg-chart' + (cls ? ' ' + cls : ''))
    if (spec.label) { box.setAttribute('role', 'img'); box.setAttribute('aria-label', spec.label) }
    el.appendChild(box)
    return box
  }
  function legend(el, names, ref) {
    var html = names.map(function (n, i) { return '<span data-s="' + (i + 1) + '">' + esc(n) + '</span>' }).join('')
    if (ref) html += '<span data-s="ref">' + esc(ref) + '</span>'
    el.appendChild(h('div', 'bn-legend dg-legend', html))
  }
  function numbers(el, spec, head, rows) {
    if (!spec.numbers) return
    var html = '<summary>Numbers</summary><div class="bn-table-wrap"><table class="bn-table"><thead><tr>' + head.map(function (c) { return '<th>' + esc(c) + '</th>' }).join('') + '</tr></thead><tbody>'
    html += rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + esc(c) + '</td>' }).join('') + '</tr>' }).join('')
    el.appendChild(h('details', 'dg-numbers', html + '</tbody></table></div>'))
  }
  function plural(n, spec) { return spec.unit ? ' ' + (n === 1 ? spec.unit : spec.units || spec.unit + 's') : '' }
  function fixed(v, spec) { return spec.decimals == null ? String(v) : (+v).toFixed(spec.decimals) }
  function clock(ms, offset) {
    var d = new Date(ms + offset * 60000)
    return String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0')
  }

  function chartColumn(el, spec, W) {
    var data = spec.data, H = spec.height || 190, m = { l: 30, r: 6, t: 10, b: 36 }, step = spec.step || 5
    var every = spec.every || Math.max(1, Math.ceil(data.length / 8))
    var max = niceMax(Math.max.apply(null, data.map(function (d) { return d.value })), step)
    var box = chartBox(el, spec)
    var g = s('svg', { viewBox: '0 0 ' + W + ' ' + H, height: H }, box)
    var iw = W - m.l - m.r, ih = H - m.t - m.b, band = iw / data.length
    for (var v = 0; v <= max; v += step) {
      var y = m.t + ih - v / max * ih
      s('line', { class: v ? 'dg-gridline' : 'dg-axis', x1: m.l, x2: W - m.r, y1: y, y2: y }, g)
      text(g, m.l - 6, y + 4, v, { 'text-anchor': 'end' })
    }
    var lastGroup = null
    data.forEach(function (d, i) {
      var x = m.l + i * band, bw = Math.max(2, band - 3), hh = d.value / max * ih
      if (d.value) s('path', { d: columnPath(x + 1.5, m.t + ih - hh, bw, hh, 3), fill: 'var(--s1)' }, g)
      if (i % every === 0) {
        text(g, x + band / 2, H - m.b + 16, d.label, { 'text-anchor': 'middle' })
        if (d.group && d.group !== lastGroup) text(g, x + band / 2, H - m.b + 30, d.group, { 'text-anchor': 'middle' })
        lastGroup = d.group
      }
      var hit = s('rect', { class: 'dg-hit', x: x, y: m.t, width: band, height: ih }, g)
      hover(hit, '<b>' + esc(d.value + plural(d.value, spec)) + '</b><small>' + esc((d.group ? d.group + ' ' : '') + d.label) + '</small>')
    })
    numbers(el, spec, [spec.xName || 'Label', spec.yName || 'Value'], data.map(function (d) { return [(d.group ? d.group + ' ' : '') + d.label, d.value] }))
  }

  function chartStack(el, spec, W) {
    var rows = spec.rows, series = spec.series, step = spec.step || 10, unit = spec.unit || ''
    var rowH = 26, gap = 20, m = { l: 64, r: 74, t: 6, b: 28 }
    var H = m.t + rows.length * rowH + (rows.length - 1) * gap + m.b
    var totals = rows.map(function (r) { return r.values.reduce(function (a, b) { return a + b }, 0) })
    var max = niceMax(Math.max.apply(null, totals), step)
    legend(el, series)
    var box = chartBox(el, spec)
    var g = s('svg', { viewBox: '0 0 ' + W + ' ' + H, height: H }, box)
    var iw = W - m.l - m.r
    var x = function (v) { return m.l + v / max * iw }
    for (var v = 0; v <= max; v += step) {
      s('line', { class: v ? 'dg-gridline' : 'dg-axis', x1: x(v), x2: x(v), y1: m.t, y2: H - m.b + 4 }, g)
      text(g, x(v), H - 8, v + (v === max && unit ? ' ' + unit : ''), { 'text-anchor': 'middle' })
    }
    rows.forEach(function (row, r) {
      var y = m.t + r * (rowH + gap), at = 0
      text(g, m.l - 10, y + rowH / 2 + 4, row.label, { 'text-anchor': 'end', class: 'dg-ink' })
      row.values.forEach(function (v, k) {
        if (!v) return
        var x0 = x(at), x1 = x(at + v)
        var seg = s('rect', { x: x0 + 1, y: y, width: Math.max(2, x1 - x0 - 2), height: rowH, rx: 3, fill: 'var(--s' + (k + 1) + ')' }, g)
        hover(seg, '<b>' + esc(row.label + ' · ' + series[k]) + '</b><small>' + esc(v + (unit ? ' ' + unit : '')) + '</small>')
        at += v
      })
      var total = Math.round(totals[r])
      text(g, x(at) + 8, y + rowH / 2 + 4, total ? total + (unit ? ' ' + unit : '') : 'under 1' + (unit ? ' ' + unit : ''), { class: 'dg-ink' })
    })
    numbers(el, spec, [spec.rowName || 'Row'].concat(series.map(function (n) { return n + (unit ? ' (' + unit + ')' : '') })), rows.map(function (r) { return [r.label].concat(r.values) }))
  }

  function chartLine(el, spec, W) {
    var H = spec.height || 240, m = { l: 34, r: 84, t: 12, b: 30 }, lo = spec.min, hi = spec.max, step = spec.step || 1
    var xs = spec.x, n = xs.length, decimals = spec.decimals == null ? 1 : spec.decimals
    legend(el, spec.series.map(function (se) { return se.name }), spec.target && spec.target.label)
    var box = chartBox(el, spec)
    var g = s('svg', { viewBox: '0 0 ' + W + ' ' + H, height: H }, box)
    var iw = W - m.l - m.r, ih = H - m.t - m.b
    var x = function (i) { return m.l + i / (n - 1) * iw }
    var y = function (v) { return m.t + (hi - v) / (hi - lo) * ih }
    for (var v = lo; v <= hi + 0.001; v += step) {
      s('line', { class: v === lo ? 'dg-axis' : 'dg-gridline', x1: m.l, x2: m.l + iw, y1: y(v), y2: y(v) }, g)
      text(g, m.l - 6, y(v) + 4, v.toFixed(decimals), { 'text-anchor': 'end' })
    }
    xs.forEach(function (w, i) { if (i % 2 === 0 || i === n - 1) text(g, x(i), H - 10, w, { 'text-anchor': 'middle' }) })
    if (spec.target) {
      s('line', { x1: m.l, x2: m.l + iw, y1: y(spec.target.value), y2: y(spec.target.value), stroke: 'var(--fg-muted)', 'stroke-width': 1.5, 'stroke-dasharray': '5 4' }, g)
      text(g, m.l + iw + 8, y(spec.target.value) + 4, spec.target.label || String(spec.target.value), {})
    }
    spec.series.forEach(function (se, k) {
      var col = 'var(--s' + (k + 1) + ')'
      s('path', { d: se.values.map(function (v, i) { return (i ? 'L' : 'M') + x(i) + ' ' + y(v) }).join(''), fill: 'none', stroke: col, 'stroke-width': 2, 'stroke-linejoin': 'round' }, g)
      se.values.forEach(function (v, i) { s('circle', { cx: x(i), cy: y(v), r: 3.5, fill: col, stroke: 'var(--surface)', 'stroke-width': 1.5 }, g) })
      text(g, m.l + iw + 8, y(se.values[n - 1]) + 4, se.name, { class: 'dg-ink' })
    })
    var cross = s('line', { class: 'dg-cross', y1: m.t, y2: m.t + ih, x1: m.l, x2: m.l, visibility: 'hidden' }, g)
    var hit = s('rect', { class: 'dg-hit', x: m.l, y: m.t, width: iw, height: ih }, g)
    hit.addEventListener('pointermove', function (ev) {
      var r = g.getBoundingClientRect()
      var i = Math.round(((ev.clientX - r.left) * (W / r.width) - m.l) / iw * (n - 1))
      i = Math.max(0, Math.min(n - 1, i))
      cross.setAttribute('x1', x(i))
      cross.setAttribute('x2', x(i))
      cross.setAttribute('visibility', 'visible')
      showTip('<b>' + esc(xs[i]) + '</b>' + spec.series.map(function (se) { return '<small>' + esc(se.name + ' ' + se.values[i].toFixed(decimals)) + '</small>' }).join(''), ev)
    })
    hit.addEventListener('pointerleave', function () { cross.setAttribute('visibility', 'hidden'); hideTip() })
    numbers(el, spec, [spec.xName || 'X'].concat(spec.series.map(function (se) { return se.name })), xs.map(function (w, i) { return [w].concat(spec.series.map(function (se) { return se.values[i].toFixed(decimals) })) }))
  }

  function chartStrip(el, spec, W) {
    var rows = spec.rows, offset = spec.offset == null ? -new Date().getTimezoneOffset() : spec.offset
    var spans = spec.spans.map(function (sp) { return { row: sp.row, start: Date.parse(sp.start), end: Date.parse(sp.end) } })
    var t0 = Math.min.apply(null, spans.map(function (sp) { return sp.start })), tEnd = Math.max.apply(null, spans.map(function (sp) { return sp.end }))
    var rowH = 18, gap = 6, m = { l: 74, r: 12, t: 22, b: 26 }, tick = (spec.tick || 15) * 60000
    var H = m.t + rows.length * (rowH + gap) - gap + m.b
    var box = chartBox(el, spec)
    box.style.minWidth = '600px'
    var scroll = h('div', 'dg-scroll')
    el.insertBefore(scroll, box)
    scroll.appendChild(box)
    W = Math.max(W, 600)
    var g = s('svg', { viewBox: '0 0 ' + W + ' ' + H, height: H }, box)
    var iw = W - m.l - m.r
    var x = function (t) { return m.l + (t - t0) / (tEnd - t0) * iw }
    var y = function (st) { return m.t + rows.indexOf(st) * (rowH + gap) }
    var firstTick = Math.ceil((t0 + offset * 60000) / tick) * tick - offset * 60000
    for (var t = firstTick; t <= tEnd; t += tick) {
      s('line', { class: 'dg-gridline', x1: x(t), x2: x(t), y1: m.t - 4, y2: H - m.b }, g)
      text(g, x(t), H - 8, clock(t, offset), { 'text-anchor': 'middle' })
    }
    rows.forEach(function (st) { text(g, m.l - 10, y(st) + rowH / 2 + 4, st, { 'text-anchor': 'end' }) })
    spans.forEach(function (sp) {
      if (rows.indexOf(sp.row) < 0) return
      var bar = s('rect', { x: x(sp.start), y: y(sp.row), width: Math.max(2, x(sp.end) - x(sp.start) - 1), height: rowH, rx: 3, fill: 'var(--s1)' }, g)
      var mins = Math.round((sp.end - sp.start) / 60000)
      hover(bar, '<b>' + esc(sp.row) + '</b><small>' + clock(sp.start, offset) + ' to ' + clock(sp.end, offset) + ' · ' + (mins || 'under 1') + ' min</small>')
    })
    ;(spec.marks || []).forEach(function (mk) {
      var cx = x(Date.parse(mk.at)), ok = mk.tone !== 'danger', cy = m.t - 12
      s('path', { d: ok ? 'M' + cx + ' ' + (cy - 6) + 'L' + (cx + 6) + ' ' + cy + 'L' + cx + ' ' + (cy + 6) + 'L' + (cx - 6) + ' ' + cy + 'Z' : 'M' + (cx - 5) + ' ' + (cy - 5) + 'L' + (cx + 5) + ' ' + (cy + 5) + 'M' + (cx + 5) + ' ' + (cy - 5) + 'L' + (cx - 5) + ' ' + (cy + 5), fill: ok ? 'var(--success)' : 'none', stroke: ok ? 'var(--surface)' : 'var(--danger)', 'stroke-width': ok ? 1.5 : 2.2, 'stroke-linecap': 'round' }, g)
      s('line', { x1: cx, x2: cx, y1: cy + 7, y2: H - m.b, stroke: ok ? 'var(--success)' : 'var(--danger)', 'stroke-width': 1, 'stroke-dasharray': '2 3', opacity: 0.7 }, g)
      var hit = s('circle', { class: 'dg-hit', cx: cx, cy: cy, r: 10 }, g)
      hover(hit, '<b>' + esc(mk.label || '') + '</b><small>' + clock(Date.parse(mk.at), offset) + '</small>')
    })
  }

  function chartCalendar(el, spec, W) {
    var days = spec.days, weeks = Math.ceil(days.length / 7), labelW = 34, gap = 3
    var levels = spec.levels || [15, 30, 45, 60], unit = spec.unit || 'minutes'
    var bucket = function (v) { if (!v) return 0; for (var i = 0; i < levels.length; i++) if (v <= levels[i]) return i + 1; return levels.length + 1 }
    var cell = Math.max(10, Math.min(22, Math.floor((W - labelW) / weeks) - gap))
    var gridW = labelW + weeks * (cell + gap), H = 20 + 7 * (cell + gap)
    var box = chartBox(el, spec)
    var g = s('svg', { viewBox: '0 0 ' + gridW + ' ' + H, height: H, style: 'max-width: ' + gridW + 'px; margin: 0 auto' }, box)
    var start = Date.parse(spec.start + 'T00:00:00Z')
    var names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    ;[0, 2, 4].forEach(function (d) { text(g, 0, 20 + d * (cell + gap) + cell * 0.72, names[d]) })
    var lastMonth = -1
    days.forEach(function (v, i) {
      var w = Math.floor(i / 7), d = i % 7, date = new Date(start + i * 86400000)
      var x = labelW + w * (cell + gap), y = 20 + d * (cell + gap)
      if (d === 0 && date.getUTCMonth() !== lastMonth) {
        lastMonth = date.getUTCMonth()
        text(g, x, 11, date.toLocaleString('en-GB', { month: 'short', timeZone: 'UTC' }))
      }
      var sq = s('rect', { x: x, y: y, width: cell, height: cell, rx: 3, fill: 'var(--q' + Math.min(5, bucket(v)) + ')' }, g)
      hover(sq, '<b>' + esc(v ? v + ' ' + unit : spec.empty || 'none') + '</b><small>' + date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }) + '</small>')
    })
    var scale = [0, 1, 2, 3, 4, 5].map(function (q) { return '<i style="background: var(--q' + q + ')"></i>' }).join('')
    el.appendChild(h('div', 'dg-keys', '<span class="dg-scale">0' + scale + esc(levels[levels.length - 1] + '+ ' + unit) + '</span>'))
  }

  function chartGap(el, spec, W) {
    var rows = spec.rows, target = spec.target, rowH = 34, m = { l: Math.min(200, W * 0.36), r: 70, t: 22, b: 8 }, lo = spec.min, hi = spec.max
    var H = m.t + rows.length * rowH + m.b
    var box = chartBox(el, spec)
    var g = s('svg', { viewBox: '0 0 ' + W + ' ' + H, height: H }, box)
    var iw = W - m.l - m.r
    var x = function (v) { return m.l + (v - lo) / (hi - lo) * iw }
    for (var v = lo; v <= hi; v += spec.step || 1) {
      s('line', { class: 'dg-gridline', x1: x(v), x2: x(v), y1: m.t - 6, y2: H - m.b }, g)
      text(g, x(v), 12, v, { 'text-anchor': 'middle' })
    }
    rows.forEach(function (r, i) {
      var cy = m.t + i * rowH + rowH / 2
      text(g, m.l - 12, cy + 4, r.label, { 'text-anchor': 'end' })
      s('rect', { x: Math.min(x(r.value), x(target)), y: cy - 5, width: Math.abs(x(target) - x(r.value)), height: 10, rx: 5, fill: 'var(--primary-subtle)' }, g)
      s('line', { x1: x(target), x2: x(target), y1: cy - 9, y2: cy + 9, stroke: 'var(--fg)', 'stroke-width': 2, 'stroke-linecap': 'round' }, g)
      var dot = s('circle', { cx: x(r.value), cy: cy, r: 6, fill: 'var(--s1)', stroke: 'var(--surface)', 'stroke-width': 2 }, g)
      text(g, x(hi) + 10, cy + 4, fixed(r.value, spec) + ' → ' + fixed(target, spec), { class: 'dg-ink' })
      hover(dot, '<b>' + esc(r.label) + '</b><small>now ' + fixed(r.value, spec) + ' · ' + fixed(Math.max(0, target - r.value), spec) + ' to go</small>')
    })
  }

  /* four tinted corners, each named with what to do there, and plain words on both axes */
  function chartQuadrant(el, spec, W) {
    var H = spec.height || 420, m = { l: 34, r: 10, t: 10, b: 40 }
    var box = chartBox(el, spec, 'qd')
    box.style.minWidth = '600px'
    var scroll = h('div', 'dg-scroll')
    el.insertBefore(scroll, box)
    scroll.appendChild(box)
    W = Math.max(W, 600)
    var g = s('svg', { viewBox: '0 0 ' + W + ' ' + H, height: H }, box)
    var iw = W - m.l - m.r, ih = H - m.t - m.b
    var x = function (v) { return m.l + v * iw }, y = function (v) { return m.t + (1 - v) * ih }
    var names = spec.corners || []
    var corners = [
      { x: 0, y: 0.5, fill: 'var(--success-subtle)', ay: 0.97, anchor: 'start' },
      { x: 0.5, y: 0.5, fill: 'var(--primary-subtle)', ay: 0.97, anchor: 'end' },
      { x: 0, y: 0, fill: 'var(--bg-muted)', ay: 0.09, anchor: 'start' },
      { x: 0.5, y: 0, fill: 'var(--warning-subtle)', ay: 0.09, anchor: 'end' },
    ]
    corners.forEach(function (c, i) {
      s('rect', { x: x(c.x) + 2, y: y(c.y + 0.5) + 2, width: iw / 2 - 4, height: ih / 2 - 4, rx: 12, fill: c.fill }, g)
      var name = names[i]
      if (!name) return
      /* the name sits inside its tint, a fixed 22px from the side and the edge */
      var left = c.anchor === 'start', top = c.ay > 0.5
      var tx = left ? x(c.x) + 2 + 22 : x(c.x) + iw / 2 - 2 - 22
      var ty = top ? y(c.y + 0.5) + 2 + 34 : y(c.y) - 2 - 36
      text(g, tx, ty, name.name, { 'text-anchor': c.anchor, class: 'dg-ink', style: 'font-size: 13px' })
      if (name.say) text(g, tx, ty + 17, name.say, { 'text-anchor': c.anchor })
    })
    var ax = spec.x || {}, ay = spec.y || {}
    if (ax.less) text(g, x(0), H - 12, '← ' + ax.less, { 'text-anchor': 'start' })
    if (ax.more) text(g, x(1), H - 12, ax.more + ' →', { 'text-anchor': 'end' })
    if (ax.name) text(g, m.l + iw / 2, H - 12, ax.name, { 'text-anchor': 'middle', class: 'dg-ink' })
    if (ay.more) text(g, 14, y(1), ay.more + ' →', { 'text-anchor': 'end', transform: 'rotate(-90 14 ' + y(1) + ')' })
    if (ay.less) text(g, 14, y(0), '← ' + ay.less, { 'text-anchor': 'start', transform: 'rotate(-90 14 ' + y(0) + ')' })
    spec.points.forEach(function (q) {
      var pill = document.createElement('span')
      pill.className = 'qd-pill'
      if (q.left) pill.setAttribute('data-left', '')
      if (q.tone) pill.setAttribute('data-tone', q.tone)
      pill.innerHTML = '<i></i>' + esc(q.name)
      pill.style.left = (x(q.x) / W * 100) + '%'
      pill.style.top = y(q.y) + 'px'
      box.appendChild(pill)
      hover(pill, '<b>' + esc(q.name) + '</b>' + (q.tip ? '<small>' + esc(q.tip) + '</small>' : ''))
    })
  }

  /* likelihood on the right, harm going up; the colour of a cell is its level, and its name is in the tooltip */
  function riskLevel(score) { return score >= 15 ? 4 : score >= 10 ? 3 : score >= 5 ? 2 : 1 }
  var LEVEL_NAME = { 1: 'low', 2: 'medium', 3: 'high', 4: 'act before the build' }
  function chartRisk(el, spec) {
    var risks = spec.risks, names = spec.levels || LEVEL_NAME
    var html = ''
    for (var row = 5; row >= 1; row--) {
      html += '<span class="rk-ax">' + row + '</span>'
      for (var col = 1; col <= 5; col++) {
        var lv = riskLevel(row * col)
        var pins = risks.filter(function (r) { return r.likely === col && r.harm === row }).map(function (r) { return '<span class="rk-pin" data-tip="' + esc('Risk ' + r.n + ' · ' + names[lv]) + '">' + esc(r.n) + '</span>' }).join('')
        html += '<span class="rk-cell" data-lv="' + lv + '" data-tip="' + esc('likely ' + col + ' of 5 · harm ' + row + ' of 5 · ' + names[lv]) + '">' + pins + '</span>'
      }
    }
    html += '<span></span>'
    for (var c = 1; c <= 5; c++) html += '<span class="rk-ax">' + c + '</span>'
    var wrap = h('div', 'dg-risk')
    var left = h('div', '', '<div class="dg-scroll"><div class="rk">' + html + '</div></div><p class="dg-note">' + esc(spec.note || 'Right: more likely, 1 to 5 · Up: more harm, 1 to 5') + '</p>')
    wrap.appendChild(left)
    var listed = risks.filter(function (r) { return r.title })
    if (listed.length) wrap.appendChild(h('ol', 'rk-list', listed.map(function (r) { return '<li><b>' + esc(r.n) + '</b>' + esc(r.title) + (r.text ? ' <span>' + esc(r.text) + '</span>' : '') + '</li>' }).join('')))
    el.appendChild(wrap)
  }

  function chartDonut(el, spec) {
    var parts = spec.parts
    var total = parts.reduce(function (a, p) { return a + p.value }, 0)
    var box = chartBox(el, spec, 'dg-donut')
    var g = s('svg', { viewBox: '0 0 200 200', width: 200, height: 200, style: 'flex: none' }, box)
    var at = 0, gap = 0.025
    parts.forEach(function (p, i) {
      var share = p.value / total, a0 = at * Math.PI * 2 + gap / 2, a1 = (at + share) * Math.PI * 2 - gap / 2
      var seg = s('path', { d: arc(100, 100, 78, a0, Math.max(a0 + 0.01, a1)), fill: 'none', stroke: 'var(--s' + (i + 1) + ')', 'stroke-width': 26 }, g)
      hover(seg, '<b>' + esc(p.label) + '</b><small>' + esc(p.value + plural(p.value, spec)) + ' · ' + Math.round(share * 100) + '%</small>')
      at += share
    })
    text(g, 100, 98, total, { 'text-anchor': 'middle', class: 'dg-ink', style: 'font-size: 26px' })
    if (spec.center) text(g, 100, 118, spec.center, { 'text-anchor': 'middle' })
    box.insertAdjacentHTML('beforeend', '<ul>' + parts.map(function (p, i) { return '<li><i style="background: var(--s' + (i + 1) + ')"></i><span>' + esc(p.label) + '</span><em>' + esc(p.value) + '</em><small>' + Math.round(p.value / total * 100) + '%</small></li>' }).join('') + '</ul>')
  }

  function chartGauge(el, spec) {
    var max = spec.max, goal = spec.goal
    var row = chartBox(el, spec, 'dg-gauges')
    spec.items.forEach(function (it) {
      var box = h('div', 'dg-gauge')
      row.appendChild(box)
      var g = s('svg', { viewBox: '0 0 180 104', width: 180, height: 104 }, box)
      var a = function (v) { return -Math.PI / 2 + v / max * Math.PI }
      s('path', { d: arc(90, 90, 70, a(0), a(max)), fill: 'none', stroke: 'var(--bg-muted)', 'stroke-width': 14, 'stroke-linecap': 'round' }, g)
      var val = s('path', { d: arc(90, 90, 70, a(0), a(Math.max(0.001, Math.min(max, it.value)))), fill: 'none', stroke: 'var(--s1)', 'stroke-width': 14, 'stroke-linecap': 'round' }, g)
      var togo = ''
      if (goal != null) {
        var pt = [90 + 70 * Math.sin(a(goal)), 90 - 70 * Math.cos(a(goal))], dir = [Math.sin(a(goal)), -Math.cos(a(goal))]
        s('line', { x1: pt[0] - dir[0] * 12, y1: pt[1] - dir[1] * 12, x2: pt[0] + dir[0] * 12, y2: pt[1] + dir[1] * 12, stroke: 'var(--fg)', 'stroke-width': 2.5, 'stroke-linecap': 'round' }, g)
        togo = fixed(Math.max(0, goal - it.value), spec) + ' to go'
      }
      text(g, 90, 80, fixed(it.value, spec), { 'text-anchor': 'middle', class: 'dg-ink', style: 'font-size: 24px' })
      hover(val, '<b>' + esc(it.label) + '</b><small>' + esc(fixed(it.value, spec) + (togo ? ' · ' + togo : '')) + '</small>')
      box.insertAdjacentHTML('beforeend', '<b>' + esc(it.label) + '</b>' + (goal != null ? '<span>' + esc('goal ' + fixed(goal, spec) + ' · ' + togo) + '</span>' : ''))
    })
  }

  function chartRings(el, spec) {
    var row = chartBox(el, spec, 'dg-rings')
    spec.sets.forEach(function (set) {
      var box = h('div', 'dg-ringset')
      row.appendChild(box)
      var g = s('svg', { viewBox: '0 0 140 140', width: 140, height: 140 }, box)
      set.rings.forEach(function (r, i) {
        var rad = 58 - i * 17, share = Math.min(1, r.value / r.max)
        s('circle', { cx: 70, cy: 70, r: rad, fill: 'none', stroke: 'var(--bg-muted)', 'stroke-width': 12 }, g)
        var ring = share >= 1
          ? s('circle', { cx: 70, cy: 70, r: rad, fill: 'none', stroke: 'var(--s' + (i + 1) + ')', 'stroke-width': 12 }, g)
          : s('path', { d: arc(70, 70, rad, 0, Math.max(0.001, share) * Math.PI * 2), fill: 'none', stroke: 'var(--s' + (i + 1) + ')', 'stroke-width': 12, 'stroke-linecap': 'round' }, g)
        hover(ring, '<b>' + esc(r.label) + '</b><small>' + esc(r.value + ' of ' + r.max) + '</small>')
      })
      box.insertAdjacentHTML('beforeend', '<b>' + esc(set.label) + '</b><ul>' + set.rings.map(function (r, i) { return '<li><i style="background: var(--s' + (i + 1) + ')"></i><span>' + esc(r.label) + '</span><em>' + esc(r.value + ' / ' + r.max) + '</em></li>' }).join('') + '</ul>')
    })
  }

  function chartBars(el, spec) {
    var max = spec.max || Math.max.apply(null, spec.rows.map(function (r) { return r.value }))
    el.appendChild(h('div', 'bn-bars', spec.rows.map(function (r) {
      return '<div class="bn-bars__row"' + tone(r.tone || 'primary') + (r.highlight ? ' data-highlight' : '') + '><span class="bn-bars__label">' + esc(r.label) + '</span><span class="bn-bars__track"><span class="bn-bars__bar" style="--v: ' + (r.value / max * 100).toFixed(1) + '%"></span></span><span class="bn-bars__value">' + esc(r.value) + '</span></div>'
    }).join('')))
  }

  var CHARTS = { column: chartColumn, stack: chartStack, line: chartLine, strip: chartStrip, calendar: chartCalendar, gap: chartGap, quadrant: chartQuadrant, risk: chartRisk, donut: chartDonut, gauge: chartGauge, rings: chartRings, bars: chartBars }
  function renderChart(el, spec, W) {
    var draw = CHARTS[spec.kind]
    if (!draw) throw new Error('unknown chart kind "' + spec.kind + '"; use one of ' + Object.keys(CHARTS).join(', '))
    draw(el, spec, W)
  }

  /* ---------- corners: a box never rounds past about a third of its height, so a short box is not a pill ---------- */
  var ROUNDED = '.dg-node:not([data-svg]):not([data-size="dot"]), .bd-card, .tl-card, .ms-card'
  function fitCorners(root) {
    root.querySelectorAll(ROUNDED).forEach(function (el) {
      var hgt = el.offsetHeight
      if (!hgt) return
      if (!el.dataset.r0) { el.style.borderRadius = ''; el.dataset.r0 = String(parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0) }
      el.style.borderRadius = Math.min(+el.dataset.r0, Math.round(hgt * 0.32)) + 'px'
    })
  }

  /* ---------- expand: a button opens the diagram in an overlay, where the wheel or a pinch zooms at the pointer and a drag pans ---------- */
  var EXPAND_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/></svg>'
  function ensureExpand(el, spec) {
    if (el.closest('.dg-overlay') || el.querySelector(':scope > .dg-expand')) return
    var btn = h('button', 'dg-expand', EXPAND_ICON)
    btn.type = 'button'
    btn.setAttribute('aria-label', 'Open the diagram large')
    btn.setAttribute('data-tip', 'Open large · zoom and pan')
    btn.addEventListener('click', function () { openOverlay(el, spec, btn) })
    el.appendChild(btn)
  }
  var HAND_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 11V5.5a1.5 1.5 0 0 1 3 0V11M11 10V4.5a1.5 1.5 0 0 1 3 0V10M14 10V6.5a1.5 1.5 0 0 1 3 0V14a6 6 0 0 1-6 6h-.5a6 6 0 0 1-4.6-2.2L3.6 14.7a1.5 1.5 0 0 1 2.3-1.9L8 15V8.5"/></svg>'
  var SELECT_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3l14 7-6 2-2 6z"/></svg>'
  /* a dialog layer over the page; Select lets the text be chosen, Hand drags the view; Ctrl or ⌘ with the wheel, or a pinch, zooms at the pointer */
  function openOverlay(source, spec, opener) {
    var natural = source.querySelector('.dg-scroll')
    var width = Math.max(source.clientWidth, natural ? natural.scrollWidth : 0)
    var fig = source.closest('figure'), cap = fig && fig.querySelector('figcaption')
    var title = spec.title || (cap ? cap.textContent.replace(/\s+/g, ' ').trim() : '') || 'Diagram'
    var overlay = h('div', 'dg-overlay', '<div class="dg-dialog" role="dialog" aria-modal="true">' +
      '<div class="dg-dialog__head"><p class="dg-dialog__title"></p>' +
      '<span class="dg-dialog__modes" role="group" aria-label="Mode">' +
      '<button type="button" data-mode="select" aria-label="Select text (V)" data-tip="Select · V">' + SELECT_ICON + '</button>' +
      '<button type="button" data-mode="hand" aria-label="Move the view (H, or hold Space)" data-tip="Hand · H or Space">' + HAND_ICON + '</button></span>' +
      '<span class="dg-dialog__zoom" role="group" aria-label="Zoom">' +
      '<button type="button" data-z="out" aria-label="Zoom out">−</button><output class="dg-dialog__pct">100%</output>' +
      '<button type="button" data-z="in" aria-label="Zoom in">+</button><button type="button" data-z="fit">Fit</button></span>' +
      '<button type="button" class="dg-dialog__close" data-z="close" aria-label="Close">✕</button></div>' +
      '<div class="dg-dialog__stage"></div></div>')
    var dialog = overlay.querySelector('.dg-dialog')
    dialog.setAttribute('aria-label', title)
    overlay.querySelector('.dg-dialog__title').textContent = title
    var stage = overlay.querySelector('.dg-dialog__stage'), pct = overlay.querySelector('.dg-dialog__pct')
    var copy = h('div', 'dg-dialog__copy')
    copy.style.width = width + 'px'
    stage.appendChild(copy)
    document.body.appendChild(overlay)
    var lock = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    render(copy, Object.assign({}, spec, { frame: false }))
    var s = 1, x = 0, y = 0, mode = 'select', held = false
    var apply = function () { copy.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + s + ')'; pct.textContent = Math.round(s * 100) + '%' }
    var setMode = function (m) {
      mode = m
      stage.setAttribute('data-mode', held ? 'hand' : mode)
      overlay.querySelectorAll('[data-mode]').forEach(function (b) { if (b.tagName === 'BUTTON') b.setAttribute('aria-pressed', b.getAttribute('data-mode') === mode ? 'true' : 'false') })
    }
    var fit = function () {
      var sw = stage.clientWidth, sh = stage.clientHeight, cw = copy.offsetWidth, ch = copy.offsetHeight
      s = Math.min(1.6, Math.max(0.1, Math.min((sw - 48) / cw, (sh - 48) / ch)))
      x = (sw - cw * s) / 2; y = (sh - ch * s) / 2
      apply()
    }
    /* keep the point under (px, py) in place while the scale changes */
    var zoomAt = function (next, px, py) {
      next = Math.min(6, Math.max(0.1, next))
      x = px - (px - x) * (next / s); y = py - (py - y) * (next / s); s = next
      apply()
    }
    var centre = function () { return [stage.clientWidth / 2, stage.clientHeight / 2] }
    setMode('hand')
    requestAnimationFrame(function () { requestAnimationFrame(fit) })
    stage.addEventListener('wheel', function (e) {
      e.preventDefault()
      var r = stage.getBoundingClientRect()
      // the wheel zooms gently: a mouse notch (~100 px) or a pinch step is capped at about 10%
      var dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY
      var step = Math.max(-0.1, Math.min(0.1, -dy * (e.ctrlKey ? 0.01 : 0.002)))
      zoomAt(s * Math.exp(step), e.clientX - r.left, e.clientY - r.top)
    }, { passive: false })
    var points = {}, pinch = null, drag = null
    stage.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && stage.getAttribute('data-mode') !== 'hand' && e.button !== 1) return
      stage.setPointerCapture(e.pointerId)
      points[e.pointerId] = [e.clientX, e.clientY]
      var ids = Object.keys(points)
      if (ids.length === 2) {
        var a = points[ids[0]], b = points[ids[1]]
        pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), s: s }
        drag = null
      } else drag = { x: e.clientX - x, y: e.clientY - y }
      e.preventDefault()
      stage.classList.add('is-grab')
    })
    stage.addEventListener('pointermove', function (e) {
      if (!points[e.pointerId]) return
      points[e.pointerId] = [e.clientX, e.clientY]
      var ids = Object.keys(points)
      if (pinch && ids.length === 2) {
        var a = points[ids[0]], b = points[ids[1]], r = stage.getBoundingClientRect()
        zoomAt(pinch.s * Math.hypot(a[0] - b[0], a[1] - b[1]) / pinch.d, (a[0] + b[0]) / 2 - r.left, (a[1] + b[1]) / 2 - r.top)
      } else if (drag) { x = e.clientX - drag.x; y = e.clientY - drag.y; apply() }
    })
    var up = function (e) {
      delete points[e.pointerId]
      if (Object.keys(points).length < 2) pinch = null
      if (!Object.keys(points).length) { drag = null; stage.classList.remove('is-grab') }
    }
    stage.addEventListener('pointerup', up)
    stage.addEventListener('pointercancel', up)
    stage.addEventListener('dblclick', function () { if (stage.getAttribute('data-mode') === 'hand') fit() })
    var close = function () {
      if (copy._bnDiagram) copy._bnDiagram.stop()
      overlay.remove()
      document.documentElement.style.overflow = lock
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('keyup', onKeyUp)
      if (opener) opener.focus()
    }
    var typing = function (e) { return /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) }
    var onKey = function (e) {
      if (e.key === 'Escape') return close()
      if (typing(e) || e.metaKey || e.ctrlKey) return
      if (e.key === ' ' && !held) { held = true; setMode(mode); e.preventDefault() }
      else if (e.key === 'v' || e.key === 'V') setMode('select')
      else if (e.key === 'h' || e.key === 'H') setMode('hand')
      else if (e.key === '+' || e.key === '=') zoomAt(s * 1.25, centre()[0], centre()[1])
      else if (e.key === '-') zoomAt(s / 1.25, centre()[0], centre()[1])
      else if (e.key === '0') fit()
    }
    var onKeyUp = function (e) { if (e.key === ' ' && held) { held = false; setMode(mode) } }
    document.addEventListener('keydown', onKey)
    document.addEventListener('keyup', onKeyUp)
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close() })
    overlay.querySelector('.dg-dialog__head').addEventListener('click', function (e) {
      var m = e.target.closest('button[data-mode]')
      if (m) return setMode(m.getAttribute('data-mode'))
      var b = e.target.closest('button[data-z]')
      if (!b) return
      var z = b.getAttribute('data-z')
      if (z === 'close') close()
      else if (z === 'fit') fit()
      else zoomAt(s * (z === 'in' ? 1.25 : 0.8), centre()[0], centre()[1])
    })
    overlay.querySelector('.dg-dialog__close').focus()
  }

  /* ---------- scrollbars: the native bar is hidden; a thin bar floats over the box while it scrolls or under the pointer, then fades ---------- */
  var SCROLL_BOXES = '.dg-scroll, .bd-col__body, [data-bn-scroll]'
  function enhanceScroll(box) {
    if (box._bnScroll || !box.parentElement) return
    var host = box.parentElement
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative'
    box.classList.add('bn-scroll')
    var bars = { x: h('div', 'bn-sbar bn-sbar--x', '<span></span>'), y: h('div', 'bn-sbar bn-sbar--y', '<span></span>') }
    host.appendChild(bars.x)
    host.appendChild(bars.y)
    var timer = 0
    var place = function () {
      var w = box.clientWidth, hh = box.clientHeight, sw = box.scrollWidth, sh = box.scrollHeight
      var left = box.offsetLeft, top = box.offsetTop
      var fx = bars.x.firstChild, fy = bars.y.firstChild
      bars.x.hidden = sw <= w + 1
      bars.y.hidden = sh <= hh + 1
      if (!bars.x.hidden) {
        var tw = Math.max(32, w * w / sw)
        bars.x.style.cssText = 'left:' + (left + 4) + 'px;top:' + (top + hh - 9) + 'px;width:' + (w - 8) + 'px'
        fx.style.width = tw + 'px'
        fx.style.transform = 'translateX(' + ((w - 8 - tw) * box.scrollLeft / (sw - w)) + 'px)'
      }
      if (!bars.y.hidden) {
        var th = Math.max(32, hh * hh / sh)
        bars.y.style.cssText = 'left:' + (left + w - 9) + 'px;top:' + (top + 4) + 'px;height:' + (hh - 8) + 'px'
        fy.style.height = th + 'px'
        fy.style.transform = 'translateY(' + ((hh - 8 - th) * box.scrollTop / (sh - hh)) + 'px)'
      }
    }
    var show = function () {
      place()
      host.classList.add('bn-sbar-on')
      clearTimeout(timer)
      timer = setTimeout(function () { if (!box.matches(':hover') && !host.querySelector('.bn-sbar.is-drag')) host.classList.remove('bn-sbar-on') }, 1000)
    }
    box.addEventListener('scroll', show, { passive: true })
    box.addEventListener('pointerenter', show)
    box.addEventListener('pointerleave', function () { timer = setTimeout(function () { host.classList.remove('bn-sbar-on') }, 600) })
    ;['x', 'y'].forEach(function (axis) {
      var bar = bars[axis], thumb = bar.firstChild
      thumb.addEventListener('pointerdown', function (e) {
        e.preventDefault()
        thumb.setPointerCapture(e.pointerId)
        bar.classList.add('is-drag')
        var start = axis === 'x' ? e.clientX : e.clientY, from = axis === 'x' ? box.scrollLeft : box.scrollTop
        var track = axis === 'x' ? bar.clientWidth - thumb.offsetWidth : bar.clientHeight - thumb.offsetHeight
        var range = axis === 'x' ? box.scrollWidth - box.clientWidth : box.scrollHeight - box.clientHeight
        var move = function (ev) {
          var d = ((axis === 'x' ? ev.clientX : ev.clientY) - start) * range / Math.max(1, track)
          if (axis === 'x') box.scrollLeft = from + d; else box.scrollTop = from + d
        }
        var end = function () { bar.classList.remove('is-drag'); thumb.removeEventListener('pointermove', move); thumb.removeEventListener('pointerup', end); show() }
        thumb.addEventListener('pointermove', move)
        thumb.addEventListener('pointerup', end)
      })
    })
    if (window.ResizeObserver) new ResizeObserver(place).observe(box)
    box._bnScroll = { place: place }
    place()
  }
  function enhanceScrolls(root) {
    ;(root || document).querySelectorAll(SCROLL_BOXES).forEach(enhanceScroll)
  }

  /* ---------- render: draw when visible, again on resize and when fonts arrive ---------- */
  /* a fixed type draws once; a sized type draws again when its width changes */
  var FIXED = { tree: renderTree, timeline: renderTimeline, board: renderBoard }
  var SIZED = { sequence: renderSequence, mind: renderMind, links: renderForce, force: renderForce, chart: renderChart }
  function render(el, spec) {
    if (!el || !spec) throw new Error('BenchDiagrams.render needs an element and a spec')
    var type = spec.type
    if (type !== 'graph' && !FIXED[type] && !SIZED[type]) throw new Error('unknown diagram type "' + type + '"')
    if (el._bnDiagram) el._bnDiagram.stop()
    startTips()
    el.classList.add('dg')
    el.classList.toggle('dg--bare', spec.frame === false)
    el.innerHTML = ''
    var last = 0, redraw = null, built = false
    var run = function (force) {
      var cs = getComputedStyle(el)
      var w = el.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0)
      if (!w) return
      if (type === 'graph') {
        if (!redraw) redraw = renderGraph(el, spec)
        fitCorners(el)
        redraw()
        ensureExpand(el, spec)
        enhanceScrolls(el)
        return
      }
      if (FIXED[type]) {
        if (!built) { FIXED[type](el, spec); built = true }
        fitCorners(el)
        ensureExpand(el, spec)
        enhanceScrolls(el)
        return
      }
      if (w === last && !force) return
      last = w
      el.innerHTML = ''
      SIZED[type](el, spec, w)
      fitCorners(el)
      ensureExpand(el, spec)
      enhanceScrolls(el)
    }
    var observer = window.ResizeObserver ? new ResizeObserver(function () { run() }) : null
    var restyle = function () { run(true) }
    if (observer) observer.observe(el)
    window.addEventListener('dg:restyle', restyle)
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(restyle)
    el._bnDiagram = { stop: function () { if (observer) observer.disconnect(); window.removeEventListener('dg:restyle', restyle) } }
    run()
  }

  /* ---------- mount: each [data-bn-diagram] that holds a <script type="application/json"> spec ---------- */
  function mount(root) {
    root = root || document
    enhanceScrolls(root)
    root.querySelectorAll('[data-bn-diagram]').forEach(function (el) {
      if (el.hasAttribute('data-bn-drawn')) return
      var source = el.querySelector('script[type="application/json"]')
      if (!source) return
      el.setAttribute('data-bn-drawn', '')
      try {
        render(el, JSON.parse(source.textContent))
      } catch (err) {
        console.error('BenchDiagrams: ' + (el.id ? '#' + el.id + ': ' : '') + err.message)
        el.innerHTML = ''
        el.appendChild(h('p', 'dg-error', esc('Diagram not drawn: ' + err.message)))
      }
    })
  }

  window.BenchDiagrams = { render: render, mount: mount, scrollbars: enhanceScrolls }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { mount(document) })
  else mount(document)
})();

/* Bench.diagram is the diagram library; Bench.init also draws each [data-bn-diagram] of its root. */
;(function () {
  'use strict';
  var B = window.Bench, D = window.BenchDiagrams;
  if (!B || !D) return;
  B.diagram = D;
  B.scrollbars = D.scrollbars;
  var init = B.init;
  B.init = function (root) { var r = init(root); D.mount(root || document); return r; };
})();
