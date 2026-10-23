# 2. Workspaces

> In short: a folder with `nook.yml` is a workspace. Its packs and rules reach every folder inside it. Workspaces nest, so one top workspace can serve a whole tree.

## How a workspace reaches its folders

Claude Code reads `CLAUDE.md` and `.claude/rules/` from each folder above a session. So the Nook block and the base rules of a workspace reach each folder inside it.

Claude Code reads `.claude/settings.json` only in the folder where a session starts. So the Nook plugins are on for your user, and each hook finds the nearest `nook.yml` above the session. Outside a workspace, the hooks do nothing.

## Nested workspaces

```
company/              a top workspace: packs engineering, wiki
├── nook.yml
├── shop/             a child workspace: it adds learn and turns the wiki off
│   └── nook.yml
└── billing/          no nook.yml: it gets the packs of company/
personal/             a second top workspace, with its own record
```

| Rule | Example |
|---|---|
| The packs of a folder are the union of each `nook.yml` above it. | `company/billing/` has engineering and wiki. |
| A child workspace adds a pack. | `shop/nook.yml` has `packs: [learn]`. |
| A child workspace turns a pack off. | `shop/nook.yml` has `packs: { on: [learn], off: [wiki] }`. |
| The record of a pack stays at the nearest workspace that turns it on. | One ledger and one wiki for all of `company/`. |
| A folder that holds two workspaces that must stay apart gets no packs. | The folder above `company/` and `personal/` is not a workspace. |

`nook doctor` prints the workspaces above a folder, the outermost first, and where each pack keeps its record. `nook packs` prints the same for the packs only. `nook where` prints the workspaces above and the Nook repo.

## What Nook owns

Nook writes only what it marks. Each other line is yours, and `nook init --update` never changes it.

| Nook owns | You own |
|---|---|
| the Nook block of `CLAUDE.md` | each line outside the block |
| `.claude/rules/nook/` | your own files in `.claude/rules/` |
| `.claude/output-styles/nook-companion.md` | other output styles |
| its keys in `.claude/settings.json` | your other keys |
| `.nook/` | `nook.yml` after the first init |

## The file nook.yml

```yaml
packs: [engineering, wiki, learn]   # or { on: [...], off: [...] }
rules: { off: [writing] }           # base rules that you do not want written
secrets: [config/prod.yml]          # extra secret files, paths only

engineering: { ... }                # one section for each pack; /setup writes it
wiki: { ... }
learn: { dir: learn }
```

- To drop a base rule, write its name in `rules.off`, then run `nook init --update`. The update removes the rule file. Do not write the opposite rule: Claude Code has no sure order between two rules.
- The guards block each path in `secrets` as a secret file: no read, no edit, no shell command. Write the path only, never a value.
- Each pack reads its own section. The fields are in [the reference](../reference/).

## The workspace list

`nook init` adds the workspace to `~/.config/nook/workspaces`. `nook brief` reads this list, so one brief covers each workspace that you made.
