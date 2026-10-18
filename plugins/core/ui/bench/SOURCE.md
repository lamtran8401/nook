# Bench, the UI kit of the pages

The pages that Nook builds (`nook eng item page`) use this UI kit: its tokens and its `bn-*` components.

| File | From |
|---|---|
| `tokens.json` | `project/tokens.json` of the Bench design system |
| `bundle.css` | `project/components/bundle.css` |
| `bundle.js` | `project/components/bundle.js` |

- Source: the Bench design system artifact, https://claude.ai/artifact/MPiJahgbu6W6spQitGLAAn
- Version: bundle 6.3.0: Bench 6.0.0, the layout of a graph with no places, the record and work components (records, actions, rules, outlist, task, pieces, steplist, next, changes, the met checklist, the floating tab bar), and the diagram library of the Kit Diagram Catalog v30 (https://claude.ai/artifact/PWkmBq5wnApH5CVjeigUCs) at its end; tokens version 7; 2026-10-18.
- `DIAGRAMS.md` states the spec of each diagram type.
- To update Bench, copy the three files again from the artifact and run `bun run check`. Nook makes the CSS variables from `tokens.json` when it builds a page; it never edits these files.
