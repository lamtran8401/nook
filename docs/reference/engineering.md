# The engineering pack: the contract

> In short: one item moves from the backlog to the owner's accept. The tool `nook eng` holds the ledger and the guards; the skills, the agents and the hooks use only its commands.

This file states how the code works now. The code is in `packages/engineering/`; the plugin is `plugins/engineering/`.
When the code and this file do not agree, fix one of them in the same change.

## 1. Words

| Word | Meaning |
|---|---|
| desk | a folder with `nook.yml` |
| home | the nearest desk above a folder that turns `engineering` on; the ledger, `works/` and `backlog/` live there |
| item | one piece of work with a goal and acceptance criteria (AC) |
| area | a folder of the home with a kind and its checks |
| slice | one task of an item in one area: `T1`, `T2` |
| guess | an answer that an agent took in place of a question |
| gate | a move that only the owner makes |

An item id is the key of a tracker (`SHOP-12`) or one that Nook makes (`IT-001`).
A Nook id is `IT-` and the highest IT number plus one, with three digits at least: `IT-001`, `IT-042`, `IT-1000`.

## 2. Config: the `engineering` section of `nook.yml`

```yaml
engineering:
  dir: works                             # the documents of each item: <home>/works/<id>/
  backlog: backlog                       # the tickets: <home>/backlog/<KEY>/
  protected: [main, master, develop]     # the branches that no agent builds on
  rootCauses: [Requirement problem, Design problem, Integration error, Unknown]   # the root cause types of a fix; none: any type
  unknownRootCause: Unknown              # the type that means "not known yet"; it needs a reason
  areas:
    - name: api
      path: projects/shop/api            # relative to the home
      kind: backend                      # frontend | backend | docs | data | tool
      checks: [bun test]                 # run in the area folder; [] is none; no key: verify fails until set
      test: "bun test {files}"           # the test command of a proof; {files} is replaced
      install: bun install               # run before the checks and the proof when the dependencies are missing or old
      git: true                          # false: no branch and no commit
```

The defaults are `dir: works`, `backlog: backlog` and the three protected branches. A home that keeps the default and still has the `work/` of an older Nook gets it moved to `works/` by `nook init --update`; `nook doctor` names a home that has both.
A fault in the section stops the command and names the fix: a kind that does not exist, two areas with one name, an area with no path.
The key `tracker` moved to the pack issue-tracker (`docs/reference/issues.md`). Nook reads it no more, and `nook doctor` names it with the fix.

The `install` of an area runs before `item verify` and `task prove`, and only when one of these is true:

- The area has no good install in the ledger yet.
- A lockfile changed since the last good install. The lockfiles are each of `bun.lock`, `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `uv.lock`, `poetry.lock`, `Gemfile.lock`, `go.sum` and `Cargo.lock` in the area folder. With none there, they are those of the nearest folder above, up to the root of the git repo, as for a workspace member.
- A folder that a lockfile fills beside it is gone: `node_modules` for the JavaScript lockfiles, `.venv` for `uv.lock` and `poetry.lock`.

The table `area_install` keeps the hash of the lockfiles after the last good install of each area, so an install that writes its lockfile does not run again. An area with no `install` never installs.

## 3. Roles

| Role | Who | How the tool knows |
|---|---|---|
| owner | the person | see the list below |
| lead | the main session | `CLAUDECODE` is set and `NOOK_ROLE` is not |
| builder | a builder agent | the Bash hook adds `--as builder` |
| reader | a read-only agent of the pack | the Bash hook adds `--as reader` |

The owner is one of these:
- a process that Claude Code did not start: `CLAUDECODE` is not set;
- a move that the owner typed as `/gate <move> <id>`, with the actor `owner via /gate`;
- an `/yolo` that the owner typed, with the actor `owner via /yolo`.

The Bash hook reads the role of an agent from the hook input:
- No `agent_type` and no `agent_id`: the lead.
- An `agent_type` that ends in `builder`: a builder. An `agent_id` with no type is a teammate, and only builders run as teammates.
- The readers: `verifier`, `reviewer`, `code-reviewer`, `scout`, `skeptic`, `system-designer`, `contract-designer`, `data-modeler`.
- Any other agent works for the lead and gets the rules of the lead.

The actor of an agent is its type and the last 4 characters of its `agent_id`, such as `backend-builder-3f2a`.
The hook drops a role flag that the model wrote, then adds its own flags right after `nook eng`. The lead gets `--session` only.

## 4. States and moves

```
backlog ─start→ framing ─agree→ planning ─approve★→ ready ─begin→ cooking ─submit→ review ─accept★→ done
                                 └──proceed (yolo run)──┘
review ─reject→ cooking            done ─reopen→ cooking         ready | cooking | review ─replan→ planning
planning | ready | cooking | review ─reframe→ framing            any open ─block→ blocked ─unblock→ the state before
any open ─cancel→ cancelled ─restore→ backlog                    ★ only the owner
```

| Move | Who | The guard: each gap comes with the command that fixes it |
|---|---|---|
| start | lead, owner | none; writes `spec.md` from its template |
| agree | lead, owner | see the agree list below |
| approve | owner | see the approve list below |
| proceed | lead | the item is in mode `yolo`, and the owner made the last mode change; then the approve list |
| begin | lead, owner | see the begin list below |
| submit | lead, owner | see the submit list below |
| accept | owner | see the accept list below |
| reject, replan, reframe, reopen, block, cancel | lead, owner | a `--reason` |
| unblock, restore | lead, owner | none |

agree:
- `spec.md` parses, with the front matter `kind`, `size`, `areas`, `created` and `updated`.
- `## Why` has text.
- The spec has one AC line `- [ADD|CHANGE|REMOVE|NONE] text` at least. An item of kind `investigate` has one Question at least.
- Each area of the spec is in `nook.yml`.
- No blocking question is open.
- The move writes `plan.md` and `tasks.md` from their templates.
- The move warns, and does not refuse, when the criteria go over the proposed cap: the count of the ticket plus 2, in the range of the size.

| Size | The range of criteria |
|---|---|
| S | 1 to 3 |
| M | 3 to 6 |
| L | 5 to 10 |

With no criterion in the ticket, the cap is the top of the range.

approve:
- `plan.md` is not the template. Today, Approach, Impact, Proof and Risks have text; Flow too for size L. A diagram counts as text.
- `plan.md` and `tasks.md` have both dates.
- The slices of `tasks.md` are in the ledger, and the two are equal.
- Each AC is in a slice, and each slice names an AC of the spec.
- Each slice has one area of the item.
- `depends` has no cycle.
- No blocking question is open.
- The move stores a SHA-256 of `spec.md`, `plan.md` and `tasks.md`.

begin:
- The three approved documents did not change.
- Each git area of the item is on a branch that is not protected.
- No other item in cooking uses an area of the item.

submit:
- `spec.md` did not change.
- One slice is done at least, and no slice is in todo, running, waiting or failed.
- Each check passed in the last verify after the last move back.
- Kind `investigate`: `findings.md` has text, and no verify is necessary.
- The move warns on a done slice with the proof `none` or `weak`. It does not refuse.

accept:
- `spec.md` did not change.
- Each AC is marked done, and the text of each mark is the text of the spec now.
- The spec and the ledger have the same count of criteria.
- Kind `investigate`: each Question has an Answer and an Evidence in `findings.md`.
- No child of the item is open. A done or cancelled child passes, and so does a child that `item detach` took out.
- A quick item: a verify passed.

Rules:
- `kind`, `size`, `areas` and the criteria come from the front matter and the AC lines of `spec.md`. `agree`, `approve` and `proceed` copy them into the item.
- A move back (`reject`, `replan`, `reframe`, `reopen`, `restore`) clears the approval. It also sets `evidence_from` to the last check run, so only a later verify counts.
- `reopen` sets the mode back to `normal`. A yolo run ends at the accept, and only the owner starts the next one.
- `reopen` and `restore` bring an archived ticket folder back to `backlog/<id>/`.
- From `ready` on, the slices, the criteria, and the fields `kind`, `size` and `areas` are frozen. A change stops with exit 3 and the fix `nook eng item replan <id>`.
- `item ac add` writes the new line into `spec.md` too. A quick item can add a criterion in any state.
- `quick <id|title> --area <a>` makes an item in `cooking` with one running slice for the lead. It has no spec and no plan.
- The flow file of a kind says what the guards ask for: `plugins/engineering/flows/<kind>.yml`. Each guard reads the flow of the item; no guard names a kind.

  | Rule | Values | What it does |
  |---|---|---|
  | `spec.criteria` | `required`, `none` | `agree` needs an AC line; `accept` needs each AC marked |
  | `spec.questions` | `required`, `none` | `agree` needs a question under `## Questions`; the spec template has Questions in place of the criteria |
  | `spec.sections` | a list of headings | `agree` needs text under each one; the spec template has them before the criteria |
  | `areas` | `required`, `optional` | `agree` needs areas in the front matter of `spec.md` |
  | `slices` | `required`, `optional`, `none` | `required`: the slice guards and the verify of `submit` apply, and `agree` writes `tasks.md` from its template. `optional`: they apply when the item has a `tasks.md` or a slice |
  | `submit` | a list of `findings`, `root-cause` | `findings`: `submit` needs text in `findings.md`, and `accept` an answer with evidence for each question. `root-cause`: `submit` needs `root-cause.md` with a type and the analysis |

- The kinds `feature` and `chore` need criteria and slices. The kind `fix` needs them too, and `## Reproduce`, `## Actual`, `## Expected` and its root cause. The kind `investigate` needs questions and findings with a `## Results` part. Its areas and slices are optional: with a `tasks.md`, its slices run and verify as the slices of a feature.
- The root cause of a fix: a type of `engineering.rootCauses` when the desk lists them, else any type. The type of `engineering.unknownRootCause` needs a `reason`. `submit` keeps the type in the ledger. The action that prevents the cause is not asked: a team session decides it.
- `nook doctor` names a flow file with a problem: an unknown rule, a value that the rule does not take, or a kind with no file. A move refuses while a flow file has a problem.
- Mode `yolo`: only the owner sets it, with `/gate mode <id> yolo` or `/yolo`. The Stop hook keeps the lead on the next stage; the accept stays the owner's.

## 5. The ledger: `<home>/.nook/engineering.db`

| Table | Columns |
|---|---|
| item | id, title, kind, size, mode, mode_by, state, blocked_from, reason, areas, source, rank, quick, evidence_from, version, root_cause, parent, created, updated |
| event | id, item, type, from_state, to_state, actor, role, reason, at |
| approval | item, document, hash, at |
| criterion | item, n, text, done, evidence, grade, by, at |
| slice | item, id, title, area, depends, acs, size, state, assignee, reason, files, proof, proof_note, version |
| question | id, item, text, blocking, recommended, answer, status, asked_by, answered_by, asked_at, answered_at |
| guess | id, item, question, took, other, impact, slices, status, answer, by, at |
| check_run | id, item, area, check, result, output, at |
| session | id, item, role, holds, seen_at |
| note | id, item, text, by, at |

| Field | Values |
|---|---|
| kind | `feature`, `fix`, `chore`, `investigate` |
| size | `S`, `M`, `L` |
| mode | `normal`, `yolo` |
| grade | `run`, `sourced`, `judged`, `owner` |
| proof | `none`, `proven`, `weak`, `skipped` |
| impact | `low`, `med`, `high` |
| question id, guess id | `Q<n>`, `G<n>`, counted in each item |

Slice states: `todo → running ⇄ waiting → done`; `running | waiting → failed → todo` (retry); `done → running` (reopen); any open state `→ cancelled`.
A slice starts only when the item is in `cooking` and each slice of its `depends` is done.
A running slice belongs to its builder. `check_run.output` keeps the last 4000 characters.
Each write is one transaction. `--if-version <n>` on a write of an item or a slice stops with exit 4 when the version changed.

The read paths of the web app are in `packages/engineering/src/read/reader.ts`. Each one opens the ledger read-only as a reader, so it never migrates and never writes:

| Function | Gives |
|---|---|
| `readAreas(desk)` | the areas of the home in the order of `nook.yml`; none for a desk with no home |
| `readBoard(desk)` | each open item, and each done item not yet archived: kind, size, state, areas, criteria met, slices done, next step, flags |
| `readItem(desk, id)` | the item, its next step and owner, what waits for the owner, the criteria, slices, questions, guesses, each change of state with its time, the events as sentences, the last verify run and the changed files |
| `readDocs(desk, id)` | the text of `spec.md`, `plan.md`, `tasks.md` and `walkthrough.md`, or null for one not written yet |

- What waits for the owner: the open questions, the blocking ones first, then the open guesses.
- A flag of a card names what holds the item up: each blocking question, such as `Q2 blocks`, and each failed slice, such as `T4 failed`.
- Each line of the brief of the module names its item: the id, the title and the state. The home page groups the lines by item.
- Each event reads as a sentence, such as "You approved the plan" or "The lead began the build", with a tone for its mark.
- The changed files of an area come from git: each file that differs from the merge base with the main branch, with its state and its added and removed lines. A folder, a link, a binary file or a file over 1 MB counts no lines. An area still on its main branch has none. Git runs with no optional lock, so a read never refreshes the index.
- A ledger that needs a migration is a gap: any `nook eng` command migrates it.

The pack gives `nook doctor`, `nook brief`, `nook retro` and the waiting gates through the same read-only open. A missing ledger, or one that needs a migration, is one doctor gap with its fix; the config and folder checks still run, and the brief, the retro and the gates show nothing from the ledger.

## 6. Documents: `<home>/work/<id>/`

| File | Made at | Sections |
|---|---|---|
| `spec.md` | start | see below |
| `plan.md` | agree | see below |
| `tasks.md` | agree | see below |
| `findings.md` | kind investigate | `## Q<n>` with Answer, Evidence, Open; `## Results` with one line for each result |
| `root-cause.md` | kind fix; `begin` and `quick` write it | front matter `type`, and `reason` for the unknown type; the analysis under the title |
| `walkthrough.md` | `/view`, and in review | the report of the finished work |
| `handoff.md` | `/handoff` | State, Done, Next, Open, Guesses, Watch; 40 lines at most |

`spec.md`:
- Front matter `id`, `kind`, `size`, `areas`, `created`, `updated`.
- `# <id>: <title>`, then one `> In short:` line.
- `## Why`, `## What changes`, `## Acceptance criteria` (an answer or a guess rewrites the criterion it touches, with its source), `## Details` (one line for each rule, with an example and its source: `Q1`, `G2, med` or `open`), `## Out of scope` (the parts that stay as they are first).
- One AC line is `- [TAG] text (source)`. The n-th line is AC n.
- Kind `investigate`: `## Questions` in place of the criteria.

`plan.md`:
- Front matter `id`, `approach`, `created`, `updated`.
- `# <id>: the plan`, then one `> In short:` line.
- `## Today`, `## Approach`, `## Impact`, `## Flow` (size L only), `## Proof`, `## Risks`.
- When they apply: `## System design` (size L in two places or more: a mermaid flowchart with one `subgraph` for each place), `## Data model` (a mermaid `erDiagram` of the tables that change), `## Rollout` (the stages of shipping, each with its check).
- No code, no function signature, no path with a line number. Facts only: no question, no answer, no state.

`tasks.md` holds facts only: the ledger holds the state of each slice.

`walkthrough.md`:
- `> In short:`, then `## What works now`, `## What changed` (a tree of the files from the diff of the branch), `## Where to start reading`, `## How it is built` (short excerpts of code), `## Requirements met` (the criteria that the ledger marks as met), `## Try it`, `## Heads up`.
- It gives no count of tests.
- With no item, Requirements met goes and `## How it works` comes after What changed.
- It copies nothing from the plan. A build that left the plan runs `nook eng item replan` before the review.

`tasks.md`:
- Front matter `id`, `created`, `updated`; then `# <id>: the slices` and an optional `> In short:` line.
- One `## T<n>: title` for each slice, with the lines `area:`, `depends:`, `acs:`, `size:`, `files:` and `done when:`.
- `proof: none (<reason>)` marks a slice with no test to prove. Its proof is `skipped`.
- The parser skips the front matter, the In short line and each fenced block.

Rules of the three documents:
- The dates use the form `YYYY-MM-DD`. A template gets the date of today; the writer changes `updated` at each edit.
- The Edit hook opens `spec.md` only in framing, and `plan.md` and `tasks.md` only in planning.
- After the approve, a change shows as a gap at begin, submit and accept, and as a doctor finding.
- The templates hold the size rule of a plan: size M has fewer than 60 lines with text, size L fewer than 100. No guard counts the lines.

Other files of the home:
- A ticket: `backlog/<KEY>/ticket.md` and `attachments/`. `item archive` moves the folder to `backlog/archive/<KEY>/`.
- An ADR: `docs/adr/NNNN-title.md`.

## 7. The tool: `nook eng`

Each read command takes `--json`. `nook eng --help` lists each command with its flags.

| Exit | Meaning |
|---|---|
| 0 | ok |
| 1 | error |
| 2 | usage |
| 3 | refused: the gaps and their fixes |
| 4 | version conflict |
| 5 | the role cannot do it |

| Group | Commands |
|---|---|
| items | `item new`, `item show`, `item list`, `item edit`, `item detach`, `item history`, `item brief`, `item mode`, `item archive` |
| moves | `item <move> <id> [--reason r]`; `item check <id>` shows the gaps of the next move |
| criteria | `item ac list`, `item ac add`, `item ac done --evidence --grade`, `item ac undo` |
| checks and git | `item verify [--area a] [--last]`, `item branch`, `item commit [--run]` |
| slices | `task import`, `task list`, `task show`, `task brief`, `task <move> <id> <T>`, `task prove` |
| questions | `ask [--blocking] [--rec]`, `answer`, `questions` |
| guesses | `guess`, `guesses`, `guess accept`, `guess flip`, `guess slices` |
| the day | `next`, `pickup`, `quick`, `note add`, `notes`, `metrics [--since <date>]` |
| decisions | `adr new`, `adr list`, `adr accept`, `adr supersede` |
| areas | `area list`, `area status` |
| pages | `item page <id> [--tab t] [--out f]`, `doc page <file.md> [--out f]` |
| the contract | `brief`, `doctor`, `init`, `hook <name>` |

An owner move from the web app adds `--via viewer`: `item <move>`, `item mode`, `answer`, `guess accept` and `guess flip`. The ledger then records the actor as `owner (viewer)`. The role and the guards stay the same.

What the commands do:
- `item new [<id>] <title>`: a first word such as `SHOP-12` is the id. With no id, Nook makes the next `IT-NNN`. `--backlog` writes `backlog/<id>/ticket.md`. `--parent <id>` names the item that it belongs to, such as the story of a sub-bug; the parent must be in the ledger.
- `item detach <id> --reason <why>`: takes an item out of its parent, such as a minor sub-bug for a later sprint. The ledger records the event `detach` with the parent and the reason. The brief of an item names its parent and its children.
- `item brief`: the context of an item for an agent, about 1800 characters at most. It holds the state, the next step, the areas, the ACs, the slices, the open questions and guesses, and the mode.
- `next [<id>]`: the next step of each item and the skill to type, the owner's steps first.
- `pickup <id>`: this session leads the item. It prints the brief and the last `handoff.md`.
- `metrics [--since <date>]`: how the flow went in a span, the last 30 days by default. Each metric comes from the events of the ledger:

  | Metric | How it counts |
  |---|---|
  | rework rate | the items submitted in the span that got a `reject` in it, out of the items submitted; and the count of rejects |
  | first pass | the items accepted in the span with no `reject` before the accept, out of the items accepted |
  | slice rework | the done slices that were reopened, out of the slices done |
  | cycle time | from the first event of an item to its accept: the median, and the longest with its item |
  | approve wait | from the last import of the slices, or the agree, to the approve; a `proceed` of a yolo run is no wait |
  | accept wait | from the last submit to the accept |

  A metric with no event in the span says "no data", never 0%.
- `item verify`: runs the checks of each area of the item in the area folder, and writes one `check_run` for each check. An install that runs first is a row `install: <command>` of the same run. A failed install runs no check of its area, and its row keeps the lines that name the error. `--last` prints the last run.
- `task prove <id> <T> --files <tests>`: see the proof list below.
- `item branch`: makes `nook/<id>-<slug>` in each git area of the item and switches to it. It refuses an area that another item in cooking uses.
- `item commit --run`: one commit for each done slice from its recorded files, on the branch of the item. It refuses a protected branch and never pushes. With no `--run`, it prints the plan.
- `guess flip`: sends the slices of the guess back to `todo`. On a `done` item, it records the answer only.
- `brief`: the lines that wait, for `nook brief`. These are the items at a gate of the owner, the open blocking questions and the failed slices.
- It also names an item in cooking with no change for a day, and a done item that waits for `/close`.
- `nook brief` adds the items done since the last brief and the items that run, through the pack module.
- `doctor`: the gaps of the pack. Examples: an area with no folder, an area with no checks, a change after the approve, a cooking item with no slice, two items in one area.
- `init`: makes `works/`, `backlog/` and `docs/adr/` in the home. `nook init` runs it too.

The proof of `task prove`:
- The area installs first when it needs to. A failed install stops the proof with its error lines, and records no proof.
- The tool makes a git worktree of the area at the merge base of the branch and the first protected branch.
- It copies the new test files into it, links the installed dependencies, and runs the `test` command of the area with `{files}`. A run stops after 4 minutes.
- A failure there is `proven`. A pass there is `weak`: the tests cannot fail.
- A load or import error is `none`, unless it names a file that the branch adds or changes. Then the tests need the new code, and the proof is `proven`.

The item page:
- `item page` builds one HTML file from `spec.md`, `plan.md`, `tasks.md`, `walkthrough.md` and the ledger, to open from the disk.
- The skills write it to `works/<id>/page.html` and never publish it.
- It uses the Bench UI kit of `plugins/core/ui/bench/`, inline in the page.
- The header shows the id, the title, the state, the kind, the size and the areas. An audit line shows the date of each move and of each document.
- One tab for each document; Walkthrough only when the file exists. With no `--tab`, the page opens on the tab of the state, such as Plan in planning.
- A mermaid flowchart or sequence diagram becomes nodes of the UI kit. A mermaid block of another kind stays as it is.
- The Tasks tab shows one lane for each area, a node for each slice, and an edge for each `depends`.
- With no `--out`, the command prints the page. A reader can print it but cannot use `--out`.
- `doc page` makes the same page for one Markdown file with no item, such as the walkthrough of a question.

## 8. Permissions

| Action | owner | lead | builder | reader |
|---|---|---|---|---|
| approve, accept, mode | yes | no | no | no |
| proceed | no | yes | no | no |
| every other move of an item | yes | yes | no | no |
| item new, edit, ac add, archive, branch, commit | yes | yes | no | no |
| ask, answer, guess accept, guess flip, adr | yes | yes | no | no |
| task import, retry, reopen, cancel; quick; pickup | yes | yes | no | no |
| task start, done, wait, resume, fail | yes | yes | its own slice | no |
| guess, note add | yes | yes | yes | no |
| task prove, item verify | yes | yes | yes | the verifier |
| item ac done | yes | yes | no | the reviewer |
| read commands | yes | yes | yes | yes |

The settings of the pack also deny the owner moves to the model: `Bash(nook eng item approve *)`, `accept` and `mode`, also through `nook engineering`.

## 9. Hooks

The file is `plugins/engineering/hooks/hooks.json`. Each hook runs `nook eng hook <name>`, and does nothing outside a home.

| Event | Job | On a failure |
|---|---|---|
| PreToolUse Bash | see the Bash list below | blocks |
| PreToolUse Edit, Write | see the Edit list below | blocks |
| Stop | see the Stop list below | lets go |
| SubagentStop | holds a builder with a running slice: "finish the slice: `task done` or `task wait`" | lets go |
| TeammateIdle | holds a builder teammate while its slice runs, with the same words | lets go |
| SessionStart | the first 8 lines of `nook eng next` as context | lets go |

The Bash hook:
- It reads the command as the shell does. A quoted string is one argument, and only the command word of each simple command counts.
- The code of `sh -c`, of a shell that reads a heredoc or a pipe, and of `$( )` and backticks counts too.
- It blocks an owner move by the model, under `nook` or `nk`.
- It blocks `nook` inside `env`, `exec`, `xargs`, `eval`, `sh -c` and the like, and a call by a path to its code.
- It blocks a call as `nk`: the one name of the tool is `nook`. It blocks a command that sets `NOOK_ROLE`, `NOOK_ACTOR` or `NOOK_SESSION`, or unsets `CLAUDECODE`.
- It adds `--as`, `--actor` and `--session` to each call by an agent, so the rule `Bash(nook eng *)` still matches.
- A reader runs only reads: shell reads such as `ls`, `cat`, `grep`, `find`, `date`, `jq` and `du`, and the git reads `status`, `diff`, `log`, `show`, `rev-parse`, `ls-files`, `ls-tree`, `blame`, `grep`, `merge-base`, `rev-list`, `describe` and `shortlog`.
- A reader never runs `env`, `printenv`, `awk`, `sed`, `perl`, `python`, `node`, `xargs` or `tee`. They print the environment, write files or run code.
- A reader can run `git branch` only to list, such as `git branch --show-current` or `git branch -a`. A name, `-d`, `-m` or `-u` blocks it.
- A loop or a condition of reads passes, such as `for f in a b; do cat "$f"; done`. The guard checks each command inside it.
- A reader also runs the read commands of the tool. The verifier adds `task prove` and `item verify`; the reviewer adds `item ac done`.
- A reader cannot use `$( )`, backticks or `>`.

The Edit hook:
- A reader never writes a file.
- In `works/<id>/`: `spec.md` opens in framing, `plan.md` and `tasks.md` in planning. `findings.md`, `root-cause.md`, `handoff.md` and `walkthrough.*` are free. A builder never edits these documents.
- A file of an area changes only while a slice of that area runs in cooking. A builder edits only in the area of its own slice.
- A file outside the areas and outside `works/` is free.

The Stop hook:
- It holds the lead while a blocking question of its item is open.
- It holds the lead when a question is answered after a slice began to wait, such as an answer on the page of the item. The reason gives the answer and `nook eng task resume <id> <T>`. A resume, or a new wait, ends the hold.
- It holds the lead in a yolo run that the owner started, while the next stage is the lead's. The reason names the skill file of the stage.
- It holds only the session that leads the item, or the one yolo item that no session leads.
- It lets go while a background task runs, unless a blocking question is open.
- It lets go after 6 holds in a row; a move of the item starts the count again.
- In review, it lets go after 2 rejects, or when accept has no gap.
- In cooking, it lets go while a slice runs, or when each slice ended and one failed.

The `/gate` and `/yolo` hook is in the core (`UserPromptExpansion`). It runs an owner move of a pack because the owner typed it.
It refuses inside an agent, and in a session that a tool started. `/gate` alone lists the moves that wait for the owner.

## 10. Skills

Stage skills, which the owner types (`disable-model-invocation: true`):

| Skill | Phase |
|---|---|
| `/intake` | backlog |
| `/spec` | framing |
| `/recipe` | planning |
| `/cook` | cooking |
| `/deep-review`, `/view` | review |
| `/close` | done |
| `/quick`, `/yolo`, `/guesses`, `/handoff`, `/pickup` | any |

Craft skills, which the model starts:

| Phase | Skills |
|---|---|
| framing | `triage`, `find-repos`, `write-spec`, `spec-check` |
| planning | `write-plan`, `challenge`, `slice-tasks`, `plan-check`, `contract-check`, `adr` |
| cooking | `tdd`, `test-design`, `clean-code`, `diagnose`, `verify` |
| review | `code-review`, `verify`, `write-walkthrough` |

Each `SKILL.md` is a hub: the goal, the constraints, the steps, `## Gotchas`, and the side file to read when. The detail goes to side files.
A skill uses only the commands of section 7 and never runs an owner move. The writing rule and the question rule live in the core rules.

## 11. Agents

| Agent | Model | Tools | Returns |
|---|---|---|---|
| backend-builder | sonnet | Read, Grep, Glob, Edit, Write, Bash | the files, the tests and what each proves, the checks, the guesses |
| frontend-builder | sonnet | the same | the same, with the loading, empty and error states |
| verifier | sonnet | Read, Grep, Glob, Bash | for each area, the checks with counts; the first error lines; each proof |
| reviewer | opus | Read, Grep, Glob, Bash | accept or send back; the evidence and grade of each AC |
| code-reviewer | sonnet | Read, Grep, Glob, Bash | blocking findings from a fixed list; nits |
| scout | sonnet | Read, Grep, Glob | 40 lines at most: facts with path and line |
| skeptic | opus | Read, Grep, Glob | numbered objections, then a verdict |
| system-designer | inherit | Read, Grep, Glob, Bash | 2 or 3 options with their cost, and a recommendation |
| contract-designer | inherit | Read, Grep, Glob, Bash | each consumer of a contract: none, needs a change, breaks |
| data-modeler | inherit | Read, Grep, Glob, Bash | for each entity: migration, rows, indexes, backfill, rollback |

The blocking list of the code-reviewer:
- a swallowed error, or a secret or personal field in a log line;
- dead code, code in a comment, or a comment that tells history;
- a second copy of a helper of the area;
- a lint rule off with no reason on its line;
- a skipped test, a test that cannot fail, or a test named by an id;
- a dependency that the plan did not name.

A builder gets `nook eng task brief <id> <T>` as its brief. It runs `task start`, `task prove`, then `task done --files` or `task wait --reason`.
After three failed tries on one problem, a builder runs `task fail` and stops. At most 4 builders run at once, one for each area.
At intake, the scout reads the ticket as data and reports each line that reads as an instruction.

## 12. Templates

The templates are in `plugins/engineering/templates/`:
- `rules/engineering.md`: the rules of the flow, of git and of the code. `nook init` copies it to `.claude/rules/nook/engineering.md`.
- `rules/testing.md`: the test rules, for test files only (`paths` in its front matter).
- `settings.json`: see the list below.
- `spec.md`, `plan.md`, `tasks.md`, `findings.md`, `handoff.md`: the documents of section 6.

`settings.json`:
- allow `Bash(nook eng *)`, `Bash(git switch -c nook/*)`, `Edit(works/**)`, `Edit(backlog/**)`, `Edit(docs/adr/**)`;
- ask `Bash(git commit *)`, `Bash(git worktree *)` and the install commands;
- deny the owner moves;
- env `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH=1` and `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS=4`.

## 13. Who does the work

The lead, the main session, directs the work. The output style `nook-companion` holds the rule:

| Who | Jobs | How the lead starts it |
|---|---|---|
| lead | triage, the spec, the plan, the answers, the moves, the reports, a quick item, an item of size S with one slice | itself |
| subagent | scout, verifier, reviewer, code-reviewer, skeptic, the three designers | the Agent tool with no `name`, in the background when the lead has other work |
| teammate | a builder for an area with two or more slices | the Agent tool with `name: <area>-builder`; the next slice goes by SendMessage |
| subagent (builder) | a builder for an area with one slice | the Agent tool with no `name`, in the background |

- A teammate costs many times a subagent, so it gets a `name` only where its context is used again.
- The core settings turn agent teams on: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` and `teammateMode: auto`. So each Agent call with a `name` makes a teammate.
- With teams off, such as in a headless run, the same call makes a background subagent. SubagentStop then does the job of TeammateIdle.
- A teammate does not see the chat of the lead. The brief is all it knows.
- A teammate does not survive `/resume` or a compaction of the lead. `task list --state running` names the slices for a new teammate.
- A second job for a subagent, such as a second review round, goes by SendMessage to its id. The lead records the id with `nook eng note add`.
