# The build report

> In short: Nook is a harness kit for a developer. It has one plugin, 94 commands, 32 skills, 11 agents and 15 hooks. All 1252 tests pass. A feature is on when `nook.yml` has its section. The web app has its v3 look: one sheet, few frames, evidence at each gate.

This file states the build of today. Update its numbers in the same commit as the change that moves them.

## At a glance

| Part | Count | Check it with |
|---|---|---|
| features | 4: core, engineering, issue-tracker, wiki | `nook features` |
| commands | 94: core 12, engineering 74, issue-tracker 4, wiki 4 | `nook --help` |
| skills | 32 | `ls plugin/skills` |
| agents | 11 | `ls plugin/agents` |
| hooks | 15: core 7, engineering 7, issue-tracker 1 | `plugin/hooks/hooks.json` |
| base rules | 9: writing, safety, questions, approach, comments, engineering, testing, issue-tracker, wiki | `ls plugin/templates/rules` |
| tests | 1252 in 126 files, 0 failures | `bun run check` |
| source | about 15,200 lines of TypeScript in 7 packages | `find packages/*/src -name '*.ts*' \| xargs cat \| wc -l` |
| runtime dependencies | 2 for the CLI: `yaml` 2.9.1, `ts-pattern` 5.9.0 | `packages/*/package.json` |

## The parts and their state

| Feature | Turned on by | What works | State |
|---|---|---|---|
| core | always on | workspaces that nest, `nook init`, `nook doctor`, the secret guards, the command lists, the agent budget, the writing check, `/gate`, `/daily-brief`, `/retro`, `/grill-me` | in daily use |
| engineering | `engineering:` | the item flow from intake to close, two gates, the full, quick and yolo paths, proofs, ids by kind, the item page | in real use: three items done end to end on one workspace, one of them by `/yolo` |
| issue-tracker | `issue-tracker:` | a Jira ticket or a GitHub issue pulled into `backlog/<KEY>/`, read only; the map of the fields | built; tested against recorded answers |
| wiki | `wiki:` | shelves with indexes, drafts, the link check, retire after a merge, four skills, the librarian | built; a real workspace holds its first pages |

A desk is now called a workspace. `nook` moves the list file of the owner from `desks` to `workspaces` the first time it runs.

## How it is built

```
Claude Code session
   │  hooks, skills, agents
   ▼
plugin/                  the one plugin: skills, agents, hooks, flows, templates — no code
   │  bin/nook (a shell shim)
   ▼
apps/nook                the one binary: it joins the commands of each package
   │
   ▼
packages/core · engineering · issues · wiki     each imports only shared and workspace
packages/shared · workspace                      the CLI router, the hook I/O, workspaces, nook.yml
packages/ui                                      the UI kit of the web app
   │
   ▼
the workspace on disk         nook.yml, CLAUDE.md, .claude/rules/nook/, .nook/engineering.db, works/, docs/wiki/
```

| Layer | Facts |
|---|---|
| language | TypeScript 7.0.2, strict, run by Bun 1.4.3 with no build step |
| state | the ledger of engineering in SQLite through `node:sqlite`, which Bun and Node both run; everything else in Markdown and YAML |
| branching | `ts-pattern` with `.exhaustive()` on each union |
| rule | a package imports `@nook/shared/*` and `@nook/workspace/*` only, never another feature package |
| failure | a guard hook blocks when Nook fails; a helper hook lets the session go on |
| web | Next.js on Node, the UI kit on shadcn/ui and Radix, Tailwind with the Bench tokens |

## The guards

A guard blocks only for safety and for the moves of the owner. The rest shows at the door of a move, and the move can still run.

| Kind | Example | Effect |
|---|---|---|
| safety | an agent reads `.env` or runs a denied command | blocks |
| owner move | an agent runs `nook eng item approve` | blocks |
| move guard | submit with a slice that is not done | refuses the move, with the fix |
| door note | the plan changed after the approve; an edit outside a slice | shows at the gate; the move runs |

## Tests

| Package | Tests | Files |
|---|---|---|
| shared | 47 | 6 |
| workspace | 59 | 8 |
| core | 263 | 18 |
| engineering | 471 | 48 |
| issues | 81 | 11 |
| wiki | 34 | 3 |
| ui | 69 | 6 |
| web app | 213 | 24 |
| scripts | 15 | 2 |
| total | 1252 | 126 |

Each test uses a temporary folder and never touches `~/.claude` or the owner's folders. The engineering tests run real git repos, so they take about 60 seconds.

The other checks:

- `tsc --noEmit` for the repo, the UI kit and the web app: no type error.
- `bun run e2e`: 34 checks of the built web app and of each diagram in headless Chrome.
- `nook ste` on each Markdown file of `docs/` and `plugin/`: above 80%.
- `claude plugin validate .` after a change to a manifest.

## Limits now

| Limit | Effect | Way around |
|---|---|---|
| macOS only tested | Linux and Windows are not tested | none yet |
| the shell guard reads text | it reads the words of a command, also inside `sh -c`, `eval` and substitutions, but a program name built at run time, such as `${s}3`, passes | none: the guard stops the mistakes of an agent, not an attacker |
| one lead for each item | a second session that runs `pickup` takes the lead | one session for each item |
| four builders at most | one for each area | none needed |
| teammates do not survive a restart | a `/resume` or a compaction ends them | `/cook` starts new builders from `task list --state running` |
| agent teams are experimental | with teams off, a named agent runs as a background subagent | none needed: the hooks cover both |
| no skill evals | a change to a skill has no test of its output | read the skill and try it on a scratch workspace |

## Next steps

Each step starts with its expectation file in `docs/expect/`, before code.

| Step | What it gives | State |
|---|---|---|
| reset | a harness kit: one plugin, features by section, a workspace in place of a desk, `nook.yml` for the commands and the budget, guards at the door, one skill for each job, ids by kind, the v3 look (`docs/plan/reset.md`) | built |
| skill evals | a test case for each skill, with a prompt and the checks of its output | planned |
| lease | a lead keeps an item with a lease that a heartbeat renews, so a second session can take an item that nobody runs | planned |
| self-host | `nook web` on a private network | planned |

After each step, measure: the items on the full path against `/quick`, your minutes at the gates, the items sent back and why, and the agents that each item started.
