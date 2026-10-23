# 2. Workspaces

> In short: a folder with `nook.yml` is a workspace. Its features and rules reach every folder inside it. Workspaces nest, so one top workspace can serve a whole tree.

## How a workspace reaches its folders

Claude Code reads `CLAUDE.md` and `.claude/rules/` from each folder above a session. So the Nook block and the base rules of a workspace reach each folder inside it.

Claude Code reads `.claude/settings.json` only in the folder where a session starts. So the Nook plugin is on for your user, and each hook finds the nearest `nook.yml` above the session. Outside a workspace, the hooks do nothing.

## Nested workspaces

```
company/              a top workspace: features engineering, wiki
├── nook.yml
├── shop/             a child workspace: its own engineering section, so its own ledger
│   └── nook.yml
└── billing/          no nook.yml: it gets the features of company/
personal/             a second top workspace, with its own record
```

| Rule | Example |
|---|---|
| A feature is on where a `nook.yml` above the folder has its section. | `company/billing/` has engineering and wiki. |
| An empty section turns a feature on. | `wiki:` alone turns the wiki on. |
| The record of a feature stays at the nearest workspace with its section. | `shop/` has its own ledger; it uses the wiki of `company/`. |
| Core is always on, from the top workspace. | Each workspace gets the secret guards and `/gate`. |
| A folder that holds two workspaces that must stay apart gets no features. | The folder above `company/` and `personal/` is not a workspace. |

`nook features` prints the features on in a folder and where each keeps its record. `nook doctor` prints the same with every gap and its fix. `nook where` prints the workspaces above and the Nook repo.

## What Nook owns

Nook writes only what it marks. Each other line is yours, and `nook init --update` never changes it.

| Nook owns | You own |
|---|---|
| the Nook block of `CLAUDE.md` | each line outside the block |
| `.claude/rules/nook/` | your own files in `.claude/rules/` |
| `.claude/output-styles/nook-companion.md` | other output styles |
| its keys and rules in `.claude/settings.json` | your other keys and rules |
| `.nook/` | `nook.yml` after the first init |

## The file nook.yml

```yaml
rules: { off: [writing] }           # base rules that you do not want written
secrets: [config/prod.yml]          # extra secret files, paths only
budget: lean                        # lean or deep: how many agents a skill may start
guards:
  commands:
    allow: [gh pr create]           # an agent runs it with no question
    ask: [git push]                 # an agent asks you first
    deny: [rm -rf]                  # an agent never runs it

engineering: { ... }                # one section for each feature; /setup writes it
issue-tracker: { ... }
wiki: { ... }
```

- To drop a base rule, write its name in `rules.off`, then run `nook init --update`. The update removes the rule file. Do not write the opposite rule: Claude Code has no sure order between two rules.
- The guards block each path in `secrets` as a secret file: no read, no edit, no shell command. Write the path only, never a value.
- A lean budget starts at most one fresh reviewer and one builder for a second area. A deep budget starts the agents that the work needs. The default is lean.
- `nook init --update` writes each command as a rule of Claude Code: `gh pr create` becomes `Bash(gh pr create*)`. A rule such as `WebFetch(domain:example.com)` stays as written.
- A child workspace adds to the command lists of its parents and drops nothing. When a command leaves `nook.yml`, the next update removes its rule.
- Each feature reads its own section. The fields are in [the reference](../reference/).

The Harness page of `nook web` shows all of it for one workspace: the features, the budget, the secrets, the commands, the rules and the hooks.

## The workspace list

`nook init` adds the workspace to `~/.config/nook/workspaces`. `nook brief` reads this list, so one brief covers each workspace that you made.
