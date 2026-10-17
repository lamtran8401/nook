# Bench, the UI kit of the pages

The pages that Nook builds (`nook eng item page`) use this UI kit: its tokens and its `bn-*` components.

| File | From |
|---|---|
| `tokens.json` | `project/tokens.json` of the Bench design system |
| `bundle.css` | `project/components/bundle.css` |
| `bundle.js` | `project/components/bundle.js` |

- Source: the Bench design system artifact, https://claude.ai/artifact/MPiJahgbu6W6spQitGLAAn
- Version: 1792082075-ea9f, tokens version 7, copied on 2026-10-15.
- To update Bench, copy the three files again from the artifact and run `bun run check`. Nook makes the CSS variables from `tokens.json` when it builds a page; it never edits these files.
