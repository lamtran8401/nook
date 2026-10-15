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

  window.Bench = { version: '6.0.0', icon: icon, icons: Object.keys(P), init: init, toast: toast, setTheme: setTheme, themes: THEMES };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { init(document); });
  else init(document);
})();
