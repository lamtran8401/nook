# The engineering pack: the contract

Status: v0.1, 2026-10-15. This file is the contract between the tool, the skills, the agents and the hooks of the pack. When the code and this file do not agree, fix one of them in the same change.
The plan is in `harness-kit.md` section 4 and `harness-guide.html` chapter 8. The expectations are in `expect/v0.1.md`, E-10 to E-24.

## 1. Words
| Word | Meaning |
|---|---|
| item | one piece of work with a goal and acceptance criteria (AC). Its id is the key of the tracker (`SHOP-12`) or one that the kit makes (`IT-001`). |
| area | a folder of the environment with a kind and its checks, named in `kit.yml` |
| slice | one task of an item in one area: `T1`, `T2` |
| guess | an assumption that an agent made in place of a question to the owner |
| home | the nearest environment above the folder that turns the engineering pack on; the ledger, `work/` and `backlog/` live there |

## 2. Config: the `engineering` section of `kit.yml`
```yaml
engineering:
  dir: work                              # the documents of each item: <home>/work/<id>/
  backlog: backlog                       # the tickets: <home>/backlog/<KEY>/
  protected: [main, master, develop]     # branches that no agent builds on
  tracker: { type: none }                # none | jira | github
  areas:
    - name: bff
      path: projects/shop/bff            # relative to the home
      kind: backend                      # frontend | backend | docs | data | tool
      checks: [yarn lint, yarn test]     # run in the area folder; [] means none; missing means "verify fails until set"
      test: "yarn test {files}"          # the fast test command for a proof; {files} is replaced
      install: yarn install              # for a new worktree; the lockfile decides when missing
      git: true                          # false: no branch, no worktree, no commit
```
The tool checks the section and names each fault with its fix.

## 3. Roles
| Role | Who | How the tool knows |
|---|---|---|
| owner | the person | a process that Claude Code did not start (`CLAUDECODE` not set), or `KIT_ROLE=owner` in the env of such a process; or a move that the owner typed as `/gate` in the prompt, which a `UserPromptExpansion` hook of the core runs with the actor `owner via /gate` |
| lead | the main session | `CLAUDECODE` set and no `KIT_ROLE` |
| builder | a builder agent | the hook adds `--as builder --actor <name> --session <id>` to each `kit eng` call of an agent whose `agent_type` ends in `builder`, or that has an `agent_id` and no `agent_type` (an in-process teammate; only builders run as teammates); a flag that the model wrote is dropped first |
| reader | a read-only agent of the pack: verifier, reviewer, code-reviewer, scout, skeptic and the three designers | the hook adds `--as reader …` to each call of `kit eng` |
| lead, as a helper | any other agent, such as a general-purpose agent that the lead starts | the rules of the lead: no owner move, and the guards of the areas |

The hook blocks a command of the model that sets `KIT_ROLE`, unsets `CLAUDECODE`, or runs the tool through `env`, `exec`, `xargs`, `eval`, `sh -c` or a path to its code. The core bash guard already blocks the first two.

## 4. States and moves
```
backlog ─start→ framing ─agree→ planning ─approve★→ ready ─begin→ cooking ─submit→ checking ─accept★→ done
                                 └──────proceed (auto run)────┘
checking ─reject→ cooking      done ─reopen→ cooking      ready | cooking | checking ─replan→ planning
planning | ready | cooking | checking ─reframe→ framing      any open ─block→ blocked ─unblock→ the state before
any open ─cancel→ cancelled ─restore→ backlog                 ★ only the owner
```
| Move | Who | Guard: each gap is listed, with the command that fixes it |
|---|---|---|
| start | lead, owner | none; scaffolds `spec.md` |
| agree | lead, owner | `spec.md` parses: front matter `kind`, `size`, `areas`, `created`, `updated`; a Why; at least one AC line `- [ADD\|CHANGE\|REMOVE\|NONE] text`, or at least one Question for kind `investigate`; every area exists in `kit.yml`; no open blocking question. Scaffolds `plan.md` and `tasks.md`. |
| approve | owner | `plan.md` is filled (not the template); the slices of `tasks.md` are imported and equal the ledger; every AC is in a slice; each slice has one area of the item; no cycle in `depends`; no open blocking question. Stores a SHA-256 of `spec.md`, `plan.md`, `tasks.md`. |
| proceed | lead | the guard of approve; the item mode is `auto`, and the last mode change was by the owner |
| begin | lead, owner | no change in the three approved documents; each git area of the item is on a branch that is not protected; no other item in cooking uses an area of this item (v0.1) |
| submit | lead, owner | no change in `spec.md`; at least one slice done and none in todo, running, waiting or failed; every check passed in the last verify after the last move back; kind investigate: `findings.md` filled |
| accept | owner | no change in `spec.md`; every AC marked done, and the text of each mark equals the AC text now |
| reject, replan, reframe, reopen, block, cancel | lead, owner | a `--reason` |
| unblock, restore | lead, owner | none |

Rules:
- A move back (`reject`, `replan`, `reframe`, `reopen`, `restore`) clears the approval and sets `item.evidence_from` to the id of the last check run, so a verify counts only after it.
- A change to the slices or the ACs of an item in `ready` or later is refused with exit 3 and the fix `kit eng item replan <id>`. Nothing voids an approval in silence.
- `quick <id|title> --area <a>` makes an item in `cooking` with one running slice for the lead, with no spec and no plan. Its accept needs at least one AC (`item ac add`) and a passing verify.
- Kind `investigate`: Questions in the spec instead of ACs; no slices; `cooking` writes `findings.md`; `accept` needs an answer with evidence for every question.
- Mode `auto`: only the owner sets it (`item mode <id> auto`). The Stop hook keeps the lead on the next stage; `proceed` passes the approve gate. The accept stays the owner's.

## 5. Tables: `<home>/.kit/engineering.db`
| Table | Columns |
|---|---|
| item | id, title, kind (`feature`\|`fix`\|`chore`\|`investigate`), size (`S`\|`M`\|`L`), mode (`normal`\|`auto`), mode_by, state, blocked_from, reason, areas (JSON), source, rank, quick (0\|1), evidence_from, version, created, updated |
| event | id, item, type, from_state, to_state, actor, role, reason, at |
| approval | item, document, hash, at |
| criterion | item, n, text, done (0\|1), evidence, grade (`run`\|`sourced`\|`judged`\|`owner`), by, at |
| slice | item, id, title, area, depends (JSON), acs (JSON), size, state, assignee, reason, files (JSON), proof (`none`\|`proven`\|`weak`\|`skipped`), proof_note, version |
| question | id (`Q<n>` per item), item, text, blocking (0\|1), recommended, answer, status (`open`\|`answered`), asked_by, answered_by, asked_at, answered_at |
| guess | id (`G<n>` per item), item, question, took, other, impact (`low`\|`med`\|`high`), slices (JSON), status (`open`\|`accepted`\|`flipped`), answer, by, at |
| check_run | id, item, area, check, result (`pass`\|`fail`), output (the last 4000 characters), at |
| session | id, item, role, holds, seen_at |
| note | id, item, text, by, at |

Slice states: `todo → running ⇄ waiting → done`; `running | waiting → failed → todo` (retry); `done → running` (reopen); `* → cancelled`. A slice starts only when the item is in `cooking` and every slice in `depends` is done.
Every write is one transaction that takes the lock at its start. `--if-version <n>` on an item or slice write fails with exit 4 when the version moved.

## 6. Documents: `<home>/work/<id>/`
| File | Made at | Sections |
|---|---|---|
| `spec.md` | start | front matter `id, kind, size, areas, created, updated`; `# <id>: <title>`; one `> In short:` line; `## Why`; `## What changes`; `## Acceptance criteria` (one `- [TAG] text (source)` line each; the n-th line is AC n); `## Decisions` (a table: Point, Answer, From); `## Out of scope`. Kind investigate: `## Questions` in place of the criteria. |
| `plan.md` | agree | front matter `id, approach, created, updated`; `# <id>: the plan`; one `> In short:` line; `## Today`; `## Approach`; `## Impact`; `## Flow` (size L only); `## Proof`; `## Risks`. No code, no function signature, no path with a line number. |
| `tasks.md` | agree | front matter `id, created, updated`; `# <id>: the slices`; an optional `> In short:` line; then `## T<n>: title` and the lines `area:`, `depends:`, `acs:`, `size:`, `files:` (optional, text), `done when:`; `proof: none (reason)` when the slice has no test to prove |
| `findings.md` | kind investigate | `## Q<n>` with `Answer`, `Evidence`, `Open` |
| `walkthrough.md` | on request | the verdict, what changed, one request step by step, how each AC is met, try it, need to know; an HTML page when the visual pack is on |
| `handoff.md` | handoff | State, Done, Next, Open, Guesses, Watch; at most 40 lines |

Rules of the three documents:
- The dates use the form `YYYY-MM-DD`. A scaffold writes the date of today in `created` and `updated`. The writer changes `updated` at each edit.
- `agree` needs `## Why` with text and both dates in `spec.md`. `approve` needs both dates in `plan.md` and `tasks.md`.
- `approve` needs text in Today, Approach, Impact, Proof and Risks, and in Flow for an item of size L. A mermaid block counts as text.
- The parser of `tasks.md` skips the front matter, the `> In short:` line and every fenced block.
- The templates hold the size rules of the plan. A plan of size M has fewer than 60 lines with text. A plan of size L has fewer than 100.

Tickets: `<home>/backlog/<KEY>/ticket.md` and `attachments/`. ADRs: `<home>/docs/adr/NNNN-title.md`. Wiki pages: the wiki pack, when it is on.
The front matter of `spec.md` is the source of kind, size and areas: `agree` and `approve` copy it into the item.

## 7. The tool: `kit eng`
Every read command takes `--json`. Exit codes: 0 ok, 1 error, 2 usage, 3 refused (the gaps and their fixes), 4 version conflict, 5 the role may not do it.

| Group | Commands |
|---|---|
| items | `item new [<id>] <title...> [--kind k --size s --area a... --source s --backlog]` (a first word in the form `KEY-12` is the id; with no id, the kit makes the next `IT-NNN`), `item show <id>`, `item list [--state s]`, `item edit <id> <title\|kind\|size\|areas\|source\|rank> <value>`, `item history <id>`, `item brief <id>` (the context for an agent, at most about 1800 characters: state, next step, areas with folders, ACs with marks, slices, open questions and guesses, mode), `item mode <id> auto\|normal` (owner only), `item archive <id>` (the ticket folder to `backlog/archive/`), `item page <id> [--out <file>]` (one HTML page of the item: see below) |
| moves | `item start\|agree\|approve\|proceed\|begin\|submit\|accept\|reject\|replan\|reframe\|reopen\|block\|unblock\|cancel\|restore <id> [--reason r]`, `item check <id>` (the gaps of the next move, no move) |
| criteria | `item ac list <id>`, `item ac add <id> <text> [--tag ADD\|CHANGE\|REMOVE\|NONE]`, `item ac done <id> <n> --evidence <text> --grade run\|sourced\|judged\|owner`, `item ac undo <id> <n>` |
| checks | `item verify <id> [--area a] [--last]`, `item branch <id>`, `item commit <id> [--run]` |
| slices | `task import <id>`, `task list <id> [--ready\|--state s]`, `task show <id> <T>`, `task brief <id> <T>`, `task start\|done\|wait\|resume\|fail\|retry\|reopen\|cancel <id> <T> [--reason r] [--files f...]`, `task prove <id> <T> --files <f...>` |
| questions | `ask <id> <text> [--blocking] [--rec <answer>]`, `answer <id> <Q> <text>`, `questions [<id>] [--open]` |
| guesses | `guess <id> <question> --took <a> --other <b> --impact low\|med\|high [--slices T1,T2]`, `guesses [<id>] [--open]`, `guess accept\|flip <id> <G> [--answer <text>]`, `guess slices <id> <G> --slices T1,T2` (the slices of an open guess) |
| the day | `next [<id>]` (what to do now, and the skill to type), `pickup <id>` (records the lead session; prints the brief and the last handoff), `quick <id\|title> --area <a>` (a title gets the next `IT-NNN`), `note add <id> <text>`, `notes <id>` |
| knowledge | `adr new <title> [--item id]`, `adr list`, `adr accept <n>`, `adr supersede <n> --by <m>` |
| areas | `area list`, `area status` (folder, kind, branch, dirty files, the item that uses it) |
| contract | `brief --json` (BriefLine: items that wait for the owner = urgency now; open blocking questions; failed slices; items in cooking with no activity for a day), `doctor --json` (unknown areas, a missing `checks`, drift after approve, cooking with no slices, waiting or failed slices, two items in one area, a blocking question open for more than a day), `init` (the same folders that `kit init` makes through the pack module), `hook <name>` |

A kit-made id is `IT-` and one more than the highest IT number of the ledger, with three digits at least: `IT-001`, `IT-042`, `IT-1000`.
`item page` builds one HTML page from `spec.md`, `plan.md`, `tasks.md` and the ledger, for the artifact viewer. It has no doctype and no `html` or `body` tag. It uses the Bench UI kit of `plugins/core/ui/bench/`: the tokens, the `bn-*` components and their script go inline into the page. The page holds:
| Part | What it shows |
|---|---|
| header | the id, the title, badges for the state, the kind, the size and the areas; an audit line with the date of each move and the `updated` date of each document |
| tabs | Spec, Plan and Tasks, and Walkthrough when `walkthrough.md` exists; each tab shows the path and the front matter of its document, then the document with the components of the UI kit |
| diagrams | a mermaid flowchart or sequence diagram becomes nodes of the UI kit; the page script draws the edges; a mermaid block of another kind stays a mermaid block |
| lanes | in the Tasks tab, after the In short block: one group for each area, a node for each slice, a solid edge for each `depends`, a dashed edge to the next slice of a lane |
| lane line | the slices that start first, and the slices of different areas that run side by side |

The audit line names start, agree, approve, begin, submit and accept, when they happened.
A node label `area: text` puts the area in the kicker of the node. The marks `(new)`, `(changes)` and `(error)` at the end of a label set its tone.
Without `--out` it prints the page. With `--out` it writes the file and prints its path. A reader can print the page but cannot use `--out`.
`guess flip` sends the slices of the guess back to `todo`. On a `done` item it records the answer and sends no slice back.
`verify` runs the checks of each area of the item in the area folder (or the `verify` template of the section with `{area}`), writes one `check_run` row for each check, and keeps the last 4000 characters of output. `--last` prints the last run without a new run.
`task prove` makes a git worktree of the area at the merge base of the branch and the first protected branch, copies the new test files of the slice into it, and runs the `test` command of the area with `{files}`. A failure there is `proven`; a pass there is `weak` (the tests cannot fail); a load or import error is `none`, unless it names a file that the branch adds or changes: then the tests need the new code, and the proof is `proven`. The result goes into `slice.proof`. Submit warns on a done slice with proof `none` or `weak`; it does not block.
`item branch` makes `kit/<id>-<slug>` in each git area of the item and switches the checkout to it, or refuses when the area is in use by another item in cooking. `item commit --run` makes one commit for each done slice from its recorded files, on the branch of the item; it refuses a protected branch; it never pushes. Without `--run` it prints the plan.

## 8. Permissions
| Action | owner | lead | builder | reader |
|---|---|---|---|---|
| approve, accept, mode | yes | no | no | no |
| proceed | no | yes, in an auto run | no | no |
| every other move; item new, edit, ac add, archive; ask, answer; task import, retry, reopen, cancel; guess accept, flip; adr; commit, branch | yes | yes | no | no |
| task start, done, wait, resume, fail | yes | yes | its own slice only | no |
| task prove, item verify | yes | yes | yes | the verifier only |
| item ac done | yes | yes | no | the reviewer only |
| guess, note add | yes | yes | yes | no |
| read commands | yes | yes | yes | yes |

The owner moves are also denied to the model in `templates/settings.json`: `Bash(kit eng item approve *)`, `accept`, `mode`, and the same through `kit engineering`.

## 9. Hooks (`plugins/engineering/hooks/hooks.json`, each one `bin/kit eng hook <name>`)
| Event | Job | Fails |
|---|---|---|
| PreToolUse Bash | read the command as the shell does: a quoted string is one argument, and only the command word of each simple command counts; the code of `sh -c`, of a shell that reads a heredoc, and of `$( )` and backticks counts too; block the owner moves by the model, in any spelling; block wrappers around the tool; add `--as`, `--actor`, `--session` right after `kit eng` in each call by an agent (the lead gets `--session` only), so the permission rule `Bash(kit eng *)` still matches; a reader may run only read commands (`ls`, `cat`, `head`, `tail`, `wc`, `rg`, `grep`, `find`, `git status\|diff\|log\|show`, the read commands of the tool, plus `task prove` and `item verify` for the verifier, `item ac done` for the reviewer); no `$( )` and no `>` for a reader | closed |
| PreToolUse Edit, Write | a reader cannot write; `spec.md` opens only in framing, `plan.md` and `tasks.md` only in planning (the lead may edit `work/<id>/` otherwise only for `findings.md`, `walkthrough.md`, `handoff.md`); a file in a git area needs an item in cooking with a running slice in that area, and a builder may edit only in the areas of its own slice; a file outside the areas and outside `work/` is free | closed |
| Stop | hold the lead (`decision: block`) while a blocking question of its item is open, or while the item is in mode auto and the next stage is the lead's; the reason names the next skill: "read `${CLAUDE_PLUGIN_ROOT}/skills/<stage>/SKILL.md` and follow it for <id>"; let go after 6 holds in one session; the count resets on release | open |
| SubagentStop | hold a builder subagent that still has a running slice: "finish the slice: `kit eng task done` or `task wait`" | open |
| TeammateIdle | hold a teammate named `<area>-builder` while a slice of that area runs, with the same words; exit 2 is the only form the event honors | open |
| SessionStart | add the first lines of `kit eng next` as context | open |
| UserPromptExpansion (core) | `/gate <move> <id>`: run an owner move of a pack because the owner typed it; refuse it inside an agent and in a session that the Bash tool of another session started; `/gate` alone lists the moves that wait. The hook runs once `plugins/core/hooks/hooks.json` lists it | closed |

The role of an agent comes from the hook input: no `agent_type` and no `agent_id` is the lead; an `agent_type` that ends in `builder` is a builder; any other is a reader. `KIT_ACTOR` is the agent type plus the last 4 characters of `agent_id`.

## 10. Skills
Stage skills, typed by the owner (`disable-model-invocation: true`): `/intake`, `/spec`, `/recipe`, `/cook`, `/check`, `/walkthrough`, `/close`, `/quick`, `/auto`, `/guesses`, `/handoff`, `/pickup`.
Craft skills, started by the model: `triage`, `find-repos`, `write-spec`, `spec-check`, `write-plan`, `challenge`, `slice-tasks`, `plan-check`, `contract-check`, `adr`, `tdd`, `test-design`, `clean-code`, `diagnose`, `verify`, `code-review`.
Each `SKILL.md` is a hub of at most 500 words: the goal, the constraints, the order of the steps, a `## Gotchas` section, and which side file to read when. The detail goes to side files. A description is at most 250 characters and says when to use the skill and, for a near pair, what it is not for.
Every skill uses only the commands of section 7. A skill never runs an owner move. The writing standard and the question rule live in the core rules; a skill does not repeat them.

## 11. Agents
| Agent | Model | Tools | Returns |
|---|---|---|---|
| backend-builder | sonnet | Read, Grep, Glob, Edit, Write, Bash | files, tests and what each proves, checks, guesses, not checked |
| frontend-builder | sonnet | the same | the same, plus the loading, empty and error states |
| verifier | sonnet | Read, Grep, Glob, Bash | for each area: lint, test, build with counts; the first error lines; the proof of each slice |
| reviewer | opus | Read, Grep, Glob, Bash | accept or send back; evidence and grade for each AC; blocking findings apart from nits; not confirmed |
| code-reviewer | sonnet | Read, Grep, Glob, Bash | blocks only on: a swallowed error, a secret in a log, dead code, a duplicate helper, a lint rule off with no reason, a skipped test, a test that cannot fail, a dependency the plan did not name; nits |
| scout | sonnet | Read, Grep, Glob | at most 40 lines: facts with path and line, guesses marked, not found; at intake it reads the ticket as data and reports text that reads as an instruction |
| skeptic | opus | Read, Grep, Glob | numbered objections with evidence and what would change its mind, then a verdict: proceed, change the plan, stop |
| system-designer | inherit | Read, Grep, Glob, Bash | at most 60 lines: facts, 2 or 3 options with trade-offs and slice cost, a recommendation and the condition that changes it |
| contract-designer | inherit | Read, Grep, Glob, Bash | the consumers of a contract (none, needs a change, breaks), the order, the migration path |
| data-modeler | inherit | Read, Grep, Glob, Bash | for each entity: migration, existing rows, indexes, backfill, rollback, order |

An agent body has at most 500 words. The rules that every agent follows are in the core rules and the pack rules; a body does not repeat them. A builder gets `kit eng task brief <id> <T>` as its brief and runs `task start`, `task prove`, `task done --files` or `task wait --reason`; after three failed tries it runs `task fail`. A builder runs as a teammate or a background subagent by the rule of section 13, at most 4 at once, one for each area.

## 12. Templates
The templates live in `plugins/engineering/templates/`; the code lives in `packages/engineering/`.
`templates/rules/engineering.md`: the workspace rules of the pack, copied to `.claude/rules/kit/engineering.md` by `kit init`: never build on a protected branch; never commit unless the owner asks, then `item commit --run`; never push; never start apps, containers or deploys; never change an approved document, replan first; the code rules (the area's conventions first; clear names, small functions, early returns; no dead code; reuse a helper of the area; no dependency that the plan did not name; never swallow an error; never log a secret; comment only hard logic).
`templates/rules/testing.md`: the test rules, for test files only (`paths` in its front matter): a name that states the behavior, one behavior for each test, a test that can fail, expected values written by hand, never a skipped or weakened test.
`templates/settings.json`: allow `Bash(kit eng *)`, `Bash(git switch -c kit/*)`, `Edit(work/**)`, `Edit(backlog/**)`, `Edit(docs/adr/**)`; ask `Bash(git commit *)`, `Bash(git worktree *)`, installs; deny the owner moves; env `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH=1`, `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS=4`.
`templates/spec.md`, `plan.md`, `tasks.md`, `findings.md`, `handoff.md`: the documents of section 6.
`init` of the pack makes `<home>/work/`, `<home>/backlog/`, `<home>/docs/adr/`.

## 13. Who does the work
The lead, the main session, directs the work. The rule of the kit (the core companion style) is: a one-shot job that returns a summary runs as a subagent; a job that builds and must keep its context for the whole item runs as a teammate; everything else the lead does itself.

| Who | Jobs | How the lead starts it |
|---|---|---|
| lead | triage, the spec, the plan, the answers, the moves, the reports, a quick item or a size S item with one slice | itself |
| subagent | scout, verifier, reviewer, code-reviewer, skeptic, system-designer, contract-designer, data-modeler | the Agent tool with `subagent_type` and no `name`; `run_in_background: true` where the lead has other work meanwhile |
| teammate | backend-builder, frontend-builder for an area with two or more slices, or an item of size M or L: one for each area, alive from `begin` to `submit` | the Agent tool with `subagent_type` and `name: <area>-builder`; the next slice of the same area goes to the same teammate with SendMessage and the new `task brief` |
| subagent (builder) | a builder for an area with one slice | the same call with no `name` and `run_in_background: true` |

A teammate costs many times the tokens of a subagent, so it is given only where its context is reused. Agent teams are on in every environment: the core settings set `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` and `teammateMode: auto`. While teams are on, every Agent call with a `name` makes a teammate, so a one-shot job never gets a `name`. When teams are off (a headless run), the same call makes a background subagent and the flow still works: the SubagentStop hook takes the place of TeammateIdle.
A teammate does not see the lead's conversation and does not preload skills: the brief from `task brief` is all it knows, and the body of its agent file stands alone. A teammate does not survive `/resume` or a compaction of the lead: `task list --state running` names the slices to give to a new teammate with the same brief.
