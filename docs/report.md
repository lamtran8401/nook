# The build report

> In short: Nook has four packs, 91 commands, 45 skills, 12 agents and 12 hooks. All 802 tests pass. Engineering is in real use; the wiki and learn are built and wait for more use. The next step is the viewer.

This file states the build of today. Update its numbers in the same commit as the change that moves them.

## At a glance

| Part | Count | Check it with |
|---|---|---|
| packs | 4: core, engineering, wiki, learn | `nook packs` |
| commands | 91: core 9, engineering 69, wiki 4, learn 9 | `nook --help` |
| skills | 45: core 6, engineering 29, wiki 4, learn 6 | `ls plugins/*/skills` |
| agents | 12: engineering 10, wiki 1, learn 1 | `ls plugins/*/agents` |
| hooks | 12: core 6, engineering 6 | `plugins/*/hooks/hooks.json` |
| base rules | 9: writing, safety, questions, approach, comments, engineering, testing, wiki, learn | `ls plugins/*/templates/rules` |
| tests | 802 in 83 files, 0 failures | `bun run check` |
| source | about 9,800 lines of TypeScript in 6 packages | `find packages/*/src -name '*.ts' \| xargs cat \| wc -l` |
| runtime dependencies | 2: `yaml` 2.9.1, `ts-pattern` 5.9.0 | `packages/*/package.json` |

## The parts and their state

| Pack | Plugin | What works | State |
|---|---|---|---|
| core | `nook` | desks that nest, `nook init`, `nook doctor`, the secret guards, the writing check, `/gate`, `/brief`, `/retro`, `/grill-me` | in daily use |
| engineering | `nk-eng` | the item flow from intake to close, two gates, the full, quick and yolo paths, proofs, the item page | in real use: three items done end to end on one desk, one of them by `/yolo` |
| wiki | `nk-wiki` | shelves with indexes, drafts, the link check, retire after a merge, four skills, the librarian | built; a real desk holds its first pages |
| learn | `nk-learn` | courses with a roadmap, cards in five boxes, the mistake log, scores with evidence, `/study` | built; no course is set up on a real desk yet |

## How it is built

```
Claude Code session
   │  hooks, skills, agents
   ▼
plugins/<pack>/          pack.json, skills, agents, hooks, templates — no code
   │  bin/nook (a shell shim)
   ▼
apps/nook                the one binary: it joins the commands of each package
   │
   ▼
packages/core · engineering · wiki · learn      each imports only shared and desk
packages/shared · desk                          the CLI router, the hook I/O, desks, nook.yml
   │
   ▼
the desk on disk         nook.yml, CLAUDE.md, .claude/rules/nook/, .nook/engineering.db, works/, docs/wiki/, learn/
```

| Layer | Facts |
|---|---|
| language | TypeScript 7.0.2, strict, run by Bun 1.4.3 with no build step |
| state | the ledger of engineering in SQLite through `node:sqlite`, which Bun and Node both run; everything else in Markdown and YAML |
| branching | `ts-pattern` with `.exhaustive()` on each union |
| rule | a package imports `@nook/shared/*` and `@nook/desk/*` only, never another pack |
| failure | a guard hook blocks when Nook fails; a helper hook lets the session go on |

## Tests

| Package | Tests | Files |
|---|---|---|
| shared | 10 | 1 |
| desk | 16 | 3 |
| core | 158 | 14 |
| engineering | 339 | 40 |
| wiki | 21 | 2 |
| learn | 19 | 4 |
| scripts | 9 | 1 |
| total | 572 | 65 |

Each test uses a temporary folder and never touches `~/.claude` or the owner's folders. The engineering tests run real git repos, so they take about 40 seconds.

The other checks:

- `tsc --noEmit`: no type error.
- `nook ste` on each Markdown file of `docs/` and `plugins/`: above 80%.
- `claude plugin validate .` after a change to a manifest.

## Limits now

| Limit | Effect | Way around |
|---|---|---|
| macOS only tested | Linux and Windows are not tested | none yet |
| no tracker pull | `tracker: jira` and `github` pass the config check, but no pack pulls a ticket | write or paste the ticket into `backlog/<KEY>/ticket.md` until v0.3 |
| the shell guard reads text | it reads the words of a command, also inside `sh -c`, `eval` and substitutions, but a program name built at run time, such as `${s}3`, passes | none: the guard stops the mistakes of an agent, not an attacker |
| one lead for each item | a second session that runs `pickup` takes the lead | one session for each item |
| four builders at most | one for each area | none needed |
| teammates do not survive a restart | a `/resume` or a compaction ends them | `/cook` starts new builders from `task list --state running` |
| agent teams are experimental | with teams off, a named agent runs as a background subagent | none needed: the hooks cover both |

## Next steps

Each step starts with its expectation file in `docs/expect/`, before code.

| Step | What it gives | State |
|---|---|---|
| v0.3 | one release: the pack `issue-tracker` pulls a Jira ticket or a GitHub issue into `backlog/<KEY>/`, read only; install the dependencies of an area when they are missing; `nook web`, the desk in the browser, with your gates there; `nook search` across the wiki, the items and the courses | planned, next |
| research | `/research`: analysts in parallel, each finding with a source, a fact-checker | planned |
| visual | the page of every pack: diagrams, decks, sketches | planned |
| `/learn-progress` | a level for each skill of a course, and the plan of the next month | planned |

After each step, measure: the items on the full path against `/quick`, your minutes at the gates, the items sent back and why, and the context cost of the wiki reads.
