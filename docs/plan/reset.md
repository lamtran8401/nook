# Plan: the reset

> In short: Nook becomes a harness kit for a developer. The learn pack goes, packs go, a desk becomes a workspace, every setting lives in `nook.yml`, guards check at the door, each skill does one job, agents run by a budget, and the web app moves to a calm v3 look.

The proposal is the artifact `96JBpTowjCfiykPji8cvH9`. The owner approved it on 23 Oct 2026 and chose to build all of it in one branch.

## Why

- The flow guards block on every edit. An edit that the owner asks for in review stops, because no slice runs.
- The owner cannot open a PR: `nook.yml` has no place for the commands that an agent may run.
- One full item starts 8 to 12 agents, and each agent loads the rules again. The credits go fast.
- Five packs, 102 commands, 45 skills, 12 agents and 14 hooks are too much to hold in mind.
- The web app shows too many cards and frames. Each part has the same visual weight.

## Decisions

| Topic | Decision |
|---|---|
| purpose | a harness kit that makes Claude Code work like a careful senior developer on your repos |
| learn | removed: the package, the plugin, the rule, the folder, 6 skills, the coach agent |
| packs | removed: one plugin `nook`; a feature is on when its section is in `nook.yml` |
| name | desk becomes workspace, in the code, the CLI, the docs and the files that init writes |
| config | `nook.yml` holds `secrets`, `budget`, `guards.commands` and the section of each feature |
| guards | hard only for safety and the owner's moves; proofs and changed documents show at the door |
| edits | an edit outside a slice passes; the ledger logs it, and the accept shows it |
| skills | one skill, one job: merge only the pieces of one job; no skill with modes; no skill that chains skills |
| agents | 11 specialists stay; the budget picks how many run |
| ids | an item with no ticket gets an id from its kind: `WI`, `BUG`, `INV`, `CHR` |
| look | v3: calm, fewer cards and frames, one strong tone for what needs the owner |
| self-host | not in this build: a later step |

## Slices

| # | Slice | Done when |
|---|---|---|
| R1 | remove learn | no code, plugin, rule, skill, agent or doc names the learn pack |
| R2 | one plugin, features by section | `plugin/` is the one plugin; `nook.yml` has no `packs:`; a feature with no section is off |
| R3 | desk becomes workspace | the word desk is gone from the code, the CLI output and the docs |
| R4 | config in `nook.yml` | `guards.commands` and `budget` write `.claude/settings.json`; a rule that leaves `nook.yml` leaves the settings |
| R5 | guards at the door | no per-edit flow guard; proofs at submit; changed documents and edits outside a slice show at accept |
| R6 | one skill, one job | the skill set of the proposal; `/pr`; the budget in the skills and the persona |
| R7 | ids by kind | `nook eng item new` with no id gives `WI-001`, `BUG-001`, `INV-001` or `CHR-001` |
| R8 | the v3 look | the kit, every page and the diagram roles follow the v3 rules below |
| R9 | the docs | the guide, the references and the report state the new build; both pages are published again |

Each slice ends with `bun run check` green and one commit on the branch. A slice that changes `apps/web` or a read path also runs `bun run e2e`. After R9 the branch merges into `main` with a fast-forward, on the owner's word of 23 Oct.

## R2: features by section

| Feature | Its section | Its rules | Its state |
|---|---|---|---|
| core | always on | approach, safety, writing, comments, questions | `.nook/events/` |
| engineering | `engineering:` | engineering, testing | `.nook/engineering.db` |
| issue-tracker | `issue-tracker:` | issue-tracker | none |
| wiki | `wiki:` | wiki | none |

- The home of a feature is the nearest workspace above the folder whose `nook.yml` has its section.
- `nook init` writes the rules of each feature that is on. `nook doctor` names a `packs:` line as a gap with its fix.
- The one plugin holds every skill, agent and hook. A hook of a feature that is off passes.

## R4: the config

```yaml
secrets: [config/prod.env]
budget: lean            # lean or deep
guards:
  commands:
    allow: [gh pr create, bun test]
    ask: [git push]
    deny: [git push --force]
```

- A command becomes a rule of Claude Code: `gh pr create` becomes `Bash(gh pr create*)`.
- The safety rules stay in the settings whatever `nook.yml` says: no force push, no reset hard, no clean, no secret read.
- A child workspace adds the lists of each workspace above it.
- `.nook/settings.json` keeps the rules that nook wrote, so a rule that leaves `nook.yml` leaves the settings at the next `nook init --update`. A rule of the owner stays.

## R5: guards at the door

| Guard | After |
|---|---|
| secret read, force push, reset hard, clean, `.nook/` and settings edits | hard, always |
| approve, accept, mode by an agent | hard, always |
| a reader agent writes | hard, always |
| an area file changes with no running slice | passes; the ledger logs the file |
| `spec.md` or `plan.md` changes after the approve | passes; the accept shows "changed since approve" |
| build on a protected branch | an instruction of the rule `engineering` |
| the stop hook holds the lead on a question | removed; the stop hook drives only a yolo run |
| a slice with no proof at submit | a gap of the submit, as today |

The accept stays the owner's move. A line at the door informs the owner. It never takes the decision.

## R6: the skills

| Change | Skills |
|---|---|
| merged, one job | `spec` + `write-spec` + `spec-check` → `/specify`; `write-plan` + `plan-check` + `slice-tasks` → `/plan` |
| renamed | `brief` → `/daily-brief`; `code-review` → `/review`; `diagnose` → `/debug` |
| new | `/pr` |
| removed | `recipe`, `find-repos` (a step of `/intake`), `guesses`, `view`, 6 learn skills |
| kept | every other skill, each as its own skill |

- A lean budget starts at most 2 agents for a normal item: one reviewer, and builders only for two areas or more. `/verify` runs the check command, with no agent.
- A deep budget starts the specialist that the job needs.
- The persona does the work itself unless a read would flood the context.

## R8: the v3 look

The rules come from the owner's design principles and the calm design of 2026: not every part has the same weight.

| Role | Parts | Look |
|---|---|---|
| ground | page, sidebar, sections, board columns | flat `#f6f6f4`; a section is a heading and space, never a frame |
| object | an item card, a row that acts, the decision | white, a 1px ring and a soft shadow |
| information | text, lines, labels, tables | flat and thin; a hairline between rows |
| glass | the top bar when stuck, the drawer, ⌘K, menus, toast | frosted; never on a card or a row; never glass on glass |
| call | what waits for the owner | the one amber tone of the page |
| highlight | the one you are on | a blue tinted ring |

- One page has one strong tone: amber for a call. A state shows as a small dot and a word.
- The eye reads the page from the top left: the title, the calls, then the work. The main fact of a row sits on its first line.
- The sidebar is dimmer than the page. A page uses at most 3 type sizes besides its title.
- Fewer frames: a list is rows on the ground with hairlines. A card holds one object only. No card holds a card.
- The diagram kit keeps its layout. Its roles change: a node is a tinted shape with a 1px ring and no shadow; a group is a label and a light fill, with no dashed line; the diagram frame goes.
- New parts from the proposal: evidence beside the accept, door lines in the inbox and the gate bar, saved views and folding columns on the board, the agents of an item, and a Harness page in place of Settings.

## Out of scope

- Self-host: `nook web` on a private network.
- A server, Postgres, an outbox or a phone app.
- Renames that the owner kept: `/cook`, `/yolo`, `works/`.
