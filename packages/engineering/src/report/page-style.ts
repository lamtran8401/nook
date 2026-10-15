/** The styles of the Bench design system for the item page: the tokens (light, dark) and the components. */

export const PAGE_FONTS =
  '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap">'

export const PAGE_STYLE = `
:root {
  --bg: #f5f4ef; --bg-muted: #ecebe5; --surface: #ffffff; --fg: #16171a; --fg-muted: #5a5c61;
  --border: #e2e0d8; --border-strong: #8a877d; --primary: #2b4de6; --primary-subtle: #e7ebfd;
  --accent: #c8f03c; --accent-fg: #16171a; --success: #08705f; --success-subtle: #ddf3ee;
  --warning: #9a5b00; --warning-subtle: #fcefd6; --danger: #c2334d; --danger-subtle: #fde6ea;
  --shadow: 0 0 0 .5px rgba(22,23,26,.07), 0 2px 6px -2px rgba(22,23,26,.10), 0 14px 32px -14px rgba(22,23,26,.26);
  --svg-shadow: drop-shadow(0 6px 12px rgba(22,23,26,.16)) drop-shadow(0 1px 2px rgba(22,23,26,.08));
  --font-sans: "Be Vietnam Pro", system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #0f1012; --bg-muted: #1d1e22; --surface: #18191c; --fg: #eeede8; --fg-muted: #a3a5a9;
    --border: #2a2c30; --border-strong: #6e7075; --primary: #8fa2ff; --primary-subtle: #1d2346; --accent: #c8f03c; --accent-fg: #16171a;
    --success: #4fd1bc; --success-subtle: #0f2c28; --warning: #f2b24c; --warning-subtle: #33260f; --danger: #ff8597; --danger-subtle: #3a1820;
    --shadow: 0 0 0 .5px rgba(255,255,255,.07), 0 6px 20px -8px rgba(0,0,0,.7);
    --svg-shadow: drop-shadow(0 6px 14px rgba(0,0,0,.6));
    color-scheme: dark;
  }
}
:root[data-theme="dark"] {
  --bg: #0f1012; --bg-muted: #1d1e22; --surface: #18191c; --fg: #eeede8; --fg-muted: #a3a5a9;
  --border: #2a2c30; --border-strong: #6e7075; --primary: #8fa2ff; --primary-subtle: #1d2346; --accent: #c8f03c; --accent-fg: #16171a;
  --success: #4fd1bc; --success-subtle: #0f2c28; --warning: #f2b24c; --warning-subtle: #33260f; --danger: #ff8597; --danger-subtle: #3a1820;
  --shadow: 0 0 0 .5px rgba(255,255,255,.07), 0 6px 20px -8px rgba(0,0,0,.7);
  --svg-shadow: drop-shadow(0 6px 14px rgba(0,0,0,.6));
  color-scheme: dark;
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--fg); font-family: var(--font-sans); font-size: 16px; line-height: 1.65; }
.page {
  max-width: 780px; margin: 0 auto; padding-block: 32px 80px;
  padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px));
  display: flex; flex-direction: column; gap: 22px;
}
h1, h2, h3, h4 { margin: 0; text-wrap: balance; letter-spacing: -0.015em; }
p { margin: 0; max-width: 68ch; }
.label { font-family: var(--font-mono); font-size: 12px; letter-spacing: .07em; text-transform: uppercase; color: var(--fg-muted); font-weight: 500; }
code { font-family: var(--font-mono); font-size: .86em; background: var(--bg-muted); border: 1px solid var(--border); border-radius: 6px; padding: 1px 6px; overflow-wrap: anywhere; }
.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chip { font-family: var(--font-mono); font-size: 12px; padding: 4px 10px; border-radius: 999px; border: 1px solid var(--border); background: var(--surface); color: var(--fg-muted); }
.chip b { color: var(--fg); font-weight: 500; }
.chip.path { background: var(--primary-subtle); border-color: transparent; color: var(--primary); }
.chip.area { background: var(--inverse, var(--fg)); color: var(--bg); border-color: transparent; }

/* Head */
.hero { display: flex; flex-direction: column; gap: 14px; }
.hero h1 { font-size: clamp(1.9rem, 6.4vw, 2.7rem); line-height: 1.08; font-weight: 700; }
.hero h1 mark { background: linear-gradient(transparent 62%, var(--accent) 62%); color: inherit; padding: 0 .05em; }
.hero .lede { color: var(--fg-muted); font-size: 1.05rem; }

/* The sticky switcher */
.bar {
  position: sticky; top: env(safe-area-inset-top, 0px); z-index: 5; background: var(--bg);
  padding-block: 10px; border-bottom: 1px solid var(--border);
  display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: space-between;
}
.seg { display: inline-flex; gap: 3px; padding: 3px; border-radius: 12px; background: var(--bg-muted); border: 1px solid var(--border); }
.seg button {
  font: inherit; font-size: 14px; font-weight: 600; color: var(--fg-muted); cursor: pointer;
  background: transparent; border: 0; border-radius: 9px; padding: 6px 12px; display: inline-flex; gap: 6px; align-items: baseline;
}
.seg button .n { font-family: var(--font-mono); font-size: 11px; font-weight: 500; }
.seg button[aria-selected="true"], .seg button[aria-pressed="true"] { background: var(--surface); color: var(--fg); box-shadow: var(--shadow); }
.seg button[aria-selected="true"] .n { color: var(--primary); }
button:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }

/* The document */
.page > *, main, .panel { min-width: 0; }
.panel { display: flex; flex-direction: column; gap: 14px; }
.doc { display: flex; flex-direction: column; gap: 22px; min-width: 0; }
.doc-title { font-size: clamp(1.45rem, 4.6vw, 1.9rem); line-height: 1.15; font-weight: 700; }
.short { background: var(--primary-subtle); border-radius: 18px; padding: 16px 18px; display: flex; flex-direction: column; gap: 4px; }
.short .label { color: var(--primary); }
.short p { font-size: 15.5px; }
.sec { display: flex; flex-direction: column; gap: 12px; padding-top: 18px; border-top: 1px solid var(--border); min-width: 0; }
.sec > h3 { display: flex; }
.sec > h3 .label { font-size: 12.5px; color: var(--fg); }
.sec p { font-size: 15px; }
.doc h4 { font-size: 1rem; font-weight: 600; }
ul.facts, ol.facts { margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 6px; font-size: 15px; }
ul.facts li::marker, ol.facts li::marker { color: var(--fg-muted); }
ol.acs { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0; background: var(--surface); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; }
ol.acs li { display: grid; grid-template-columns: 40px auto minmax(0, 1fr); gap: 4px 10px; align-items: baseline; padding: 10px 14px; border-bottom: 1px solid var(--border); font-size: 14.5px; }
ol.acs li:last-child { border-bottom: 0; }
.ac-n { font-family: var(--font-mono); font-size: 11.5px; color: var(--fg-muted); }
.tag { font-family: var(--font-mono); font-size: 10.5px; font-weight: 500; letter-spacing: .04em; padding: 1px 6px; border-radius: 5px; border: 1px solid; }
.tag.tone-success { color: var(--success); background: var(--success-subtle); border-color: transparent; }
.tag.tone-warning { color: var(--warning); background: var(--warning-subtle); border-color: transparent; }
.tag.tone-danger { color: var(--danger); background: var(--danger-subtle); border-color: transparent; }
.tag.tone-ink { color: var(--fg); background: var(--bg-muted); border-color: var(--border); }
.src { font-family: var(--font-mono); font-size: 11.5px; color: var(--fg-muted); white-space: nowrap; }

.table-wrap { overflow-x: auto; background: var(--surface); border: 1px solid var(--border); border-radius: 16px; }
table { border-collapse: collapse; width: 100%; font-size: 14px; }
th, td { text-align: left; padding: 10px 14px; border-bottom: 1px solid var(--border); vertical-align: top; }
th { font-family: var(--font-mono); font-size: 11px; letter-spacing: .06em; text-transform: uppercase; color: var(--fg-muted); font-weight: 500; background: var(--bg-muted); }
tr:last-child td { border-bottom: 0; }
td.k { font-weight: 600; overflow-wrap: normal; }
@media (max-width: 560px) {
  .table-wrap.stack thead { display: none; }
  .table-wrap.stack table, .table-wrap.stack tbody, .table-wrap.stack tr { display: block; }
  .table-wrap.stack tr { padding: 12px 14px; border-bottom: 1px solid var(--border); display: flex; flex-direction: column; gap: 6px; }
  .table-wrap.stack tr:last-child { border-bottom: 0; }
  .table-wrap.stack td { display: grid; grid-template-columns: 92px minmax(0, 1fr); gap: 10px; padding: 0; border: 0; }
  .table-wrap.stack td::before { content: attr(data-label); font-family: var(--font-mono); font-size: 11px; letter-spacing: .05em; text-transform: uppercase; color: var(--fg-muted); padding-top: 3px; }
  .table-wrap.stack td.k { display: block; font-size: 15px; white-space: normal; }
  .table-wrap.stack td.k::before { content: none; }
}

/* Diagrams in Bench style */
.dg-block { margin: 0; display: flex; flex-direction: column; gap: 8px; }
.dg-wrap { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 14px; overflow-x: auto; box-shadow: var(--shadow); }

/* Slices */
.slice { background: var(--surface); border: 1px solid var(--border); border-radius: 18px; padding: 16px 18px; display: flex; flex-direction: column; gap: 10px; box-shadow: var(--shadow); }
.slice header { display: flex; gap: 10px; align-items: baseline; }
.slice .tid { font-family: var(--font-mono); font-size: 12px; font-weight: 500; background: var(--accent); color: var(--accent-fg); border-radius: 6px; padding: 1px 7px; flex: none; }
.slice h4 { font-size: 1.02rem; line-height: 1.35; }
.slice dl { margin: 0; display: grid; grid-template-columns: 86px minmax(0, 1fr); gap: 6px 12px; font-size: 14.5px; }
.slice dt { font-family: var(--font-mono); font-size: 11.5px; letter-spacing: .05em; text-transform: uppercase; color: var(--fg-muted); padding-top: 3px; }
.slice dd { margin: 0; }

pre.source {
  margin: 0; background: var(--surface); border: 1px solid var(--border); border-radius: 18px; padding: 16px;
  font-family: var(--font-mono); font-size: 12.5px; line-height: 1.65; white-space: pre-wrap; overflow-wrap: anywhere; color: var(--fg);
}
.foot { color: var(--fg-muted); font-size: 14px; }
@media (prefers-reduced-motion: no-preference) { .seg button { transition: background .15s, color .15s, box-shadow .15s; } }
/* The item page */
.hero .chips .chip.state { background: var(--accent); color: var(--accent-fg); border-color: transparent; }
.audit { color: var(--fg-muted); font-size: 14px; font-family: var(--font-mono); overflow-wrap: anywhere; }
.dg-wrap pre.mermaid svg { max-width: none; }
.mermaid .label { font-family: inherit; font-size: inherit; letter-spacing: normal; text-transform: none; color: inherit; font-weight: inherit; }
.dg-wrap pre.mermaid { margin: 0; background: transparent; border: 0; padding: 0; font-family: var(--font-mono); font-size: 12px; color: var(--fg); white-space: pre; text-align: center; }
.lanes-note { color: var(--fg-muted); font-size: 15px; }
.empty { color: var(--fg-muted); font-size: 15px; }
.panels { position: relative; overflow: hidden; padding: 4px; margin: -4px; min-width: 0; }
.panel { min-width: 0; }
.panel.is-hidden { position: absolute; visibility: hidden; left: 0; right: 0; top: 0; pointer-events: none; }
.slice dl, .slice header, .chips, .sec, .doc { min-width: 0; }
.slice h4, .ac-t, td, dd { min-width: 0; overflow-wrap: anywhere; }
`
