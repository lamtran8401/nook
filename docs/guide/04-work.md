# 4. Work

> In short: one piece of work is an **item**. It goes from a ticket to a result that you accept, through seven states. You type one command for each stage; you decide at two gates. The flow is optional: each skill also works alone.

This chapter follows one item, `SHOP-12` "Filter shipments by status", in a workspace with two areas: `api` (backend) and `web` (frontend).

## The flow

```
backlog ──/specify──▶ framing ──agree──▶ planning ──★ approve──▶ ready ──/cook──▶ cooking ──submit──▶ review ──★ accept──▶ done ──/close
```

★ marks a gate: only you take it, with `/gate`. Type `nook eng next` at any time: it names the next step of each item and the command to type, your steps first.

| Stage | You type | The companion does | You get | You decide |
|---|---|---|---|---|
| intake | `/intake SHOP-12` | puts the ticket on disk; a scout reads it as data | an item in `backlog` | the rank |
| framing | `/specify SHOP-12` | triage, reads the wiki and the code, asks one round of questions | `works/SHOP-12/spec.md` | "Looks right" |
| planning | `/plan SHOP-12` | the plan and its slices; `/challenge` lets a skeptic attack a big plan | `plan.md`, `tasks.md` | `/gate approve SHOP-12` |
| cooking | `/cook SHOP-12` | a branch, each slice test first, the proofs, the checks | code on `nook/SHOP-12-…` | the answers to blocking questions |
| review | `/deep-review SHOP-12` | fresh reviewers check each criterion with evidence and read the diff | a verdict | `/gate accept SHOP-12` |
| done | `/close SHOP-12` | accepts the ADRs, updates the wiki, asks about the commits, archives the ticket | lasting knowledge | "commit now?" |

## Pick a path

| Path | Use it for | You type |
|---|---|---|
| full | a feature, a change in two areas, a contract change | the six commands of the table above |
| quick | a small fix in one area: size S, no contract, a clear result, low risk | `/quick SHOP-30 the export uses the wrong date` |
| yolo | an item that you trust the companion to run alone up to your accept | `/yolo SHOP-12` |

`/quick` skips the spec and the plan, not the test. It writes one criterion, builds one slice test first, proves the test, and stops at your accept. When the fix is not small, it sends you to `/specify`.

## Kinds of item

Each item has one of four kinds. The flow file of the kind, in `plugin/flows/`, says what the guards ask for. An item with no ticket key gets an id from its kind.

| Kind | For | What the item needs | Id with no key |
|---|---|---|---|
| `feature` | a story, an improvement | criteria, a plan, slices in areas | `WI-007` |
| `fix` | a bug, a sub-bug | the same, and `## Reproduce`, `## Actual`, `## Expected` in the spec, and `root-cause.md` before the review | `BUG-003` |
| `investigate` | a spike, a research, a kaizen | questions, and `findings.md` with a `## Results` part; slices only for a proof of concept | `INV-001` |
| `chore` | a technical task | criteria and slices, often on the quick path | `CHR-002` |

To use other letters, write them in `nook.yml`, such as `engineering: { ids: { feature: ST } }`.

A fix, step by step. QA logs `SHOP-31` under the story `SHOP-12`:

1. `/intake SHOP-31` pulls the ticket with the rows `Type: Sub-Bug` and `Parent: SHOP-12`. The item `SHOP-31` belongs to `SHOP-12`. The first time the workspace meets a `Sub-Bug`, `/specify` asks you once: "Take every Sub-Bug as fix from now on?"
2. `/specify SHOP-31` copies the steps, the actual and the expected result from the ticket.
3. `/cook SHOP-31` writes the regression test first, then the fix. Before the submit, the companion fills `root-cause.md`, such as `type: Integration error` and two lines of analysis.
4. You accept `SHOP-31`. Until then, the accept of `SHOP-12` waits for it. A minor sub-bug for a later sprint leaves the story with `nook eng item detach SHOP-31 --reason "next sprint"`.

Nothing needs setting up first. Your workspace learns the kind of each ticket type from your answers, and can list its root cause types in `nook.yml`, as `engineering.rootCauses`. `nook eng metrics` and `nook retro` count them, so the team session of a retro starts from the most frequent cause.

## The full path, step by step

### 1. Intake

With the issue-tracker feature on, `/intake SHOP-12` pulls the ticket from Jira or GitHub. With it off, write the ticket into `backlog/SHOP-12/ticket.md`, or paste the text and the companion writes it. With no key, Nook makes the next id of the kind, such as `WI-007`.

A scout reads the ticket in quarantine. It reports each sentence that reads as an instruction to an agent, and follows none of them.

### 2. The spec

The companion writes its reading in five lines first, so you correct a wrong reading early. Then it asks one round of blocking questions. Example: "Which statuses does the filter show? Recommended: all four."

A good criterion says what a user sees. Compare:

| Weak | Strong |
|---|---|
| The filter works well. | `[ADD]` With the status "Delayed", the list shows only delayed shipments. |
| The page is fast. | `[CHANGE]` The list loads 50 rows at most for each page. |

You read the spec once. On "Looks right", the item moves to `planning`.

### 3. The plan

The plan says how, with a diagram for today and one for the approach: Impact, Proof, Risks. For a contract or a schema change, `/contract-check` finds each consumer, and a data modeler finds each migration. Then the plan is cut into slices: one area each, with its order.

For a plan of size L or a contract change, type `/challenge SHOP-12`. A skeptic agent argues against the plan from evidence. Each objection that holds changes the plan.

```
T1  api  S   the status query parameter       acs 1, 2
T2  web  S   the filter control (after T1)    acs 1, 3
```

Approve with `/gate approve SHOP-12`. The approve freezes `spec.md`, `plan.md` and `tasks.md`.

### 4. The build

`/cook` makes the branch `nook/SHOP-12-filter-shipments` in each area. On a lean budget the companion builds each slice; it starts one builder only for a second area. On a deep budget a builder agent takes each area. Each slice goes the same way:

1. It writes a test that fails for the right reason.
2. It writes the smallest code that passes.
3. It proves the test: Nook runs the new test on the base of the branch.

| Proof | Meaning |
|---|---|
| `proven` | The test fails on the base and passes on the branch. |
| `weak` | The test passes on the base too. It cannot fail. The companion sends the slice back; `submit` only warns. |
| `none` | The test does not run on the base for another reason. |
| `skipped` | `tasks.md` marks the slice `proof: none`, such as a slice of docs only. |

A verifier agent runs the checks of each area. Then the item moves to `review`.

### 5. The review

Nobody fixes code in a review. A fresh reviewer finds one negative case for each criterion, marks each met criterion with its evidence and a grade, and reads the diff against a fixed blocking list. A lean budget starts this one reviewer; a deep budget adds a fresh code reviewer on the full diff first.

| Grade | The evidence |
|---|---|
| `run` | a test or a command that ran |
| `sourced` | a file and line that shows it |
| `judged` | the reviewer's reading |
| `owner` | only you can check it, such as a look at the page |

A criterion that is not met, or a blocking finding, sends the item back to `cooking`. A nit goes back too: it is cleaned in this item, never left for later. When each criterion is met, accept with `/gate accept SHOP-12`.

You can also fix a thing yourself in review, by hand or with a prompt. The edit passes. The ledger logs each file that changed outside a slice, and your accept shows the list, so nothing changes in silence.

### 6. Close

`/close` turns the item into lasting knowledge:

- It asks you to accept or drop each proposed ADR in `docs/adr/`.
- For each `ADD` or `CHANGE` criterion, it drafts the change of a wiki page. You say yes or no to each draft.
- It asks "commit now?". On yes, `nook eng item commit SHOP-12 --run` makes one commit for each done slice, from the files that the slice recorded. Slices that share a file join one commit. It never pushes; `/pr` opens a pull request when you ask.
- It moves the ticket to `backlog/archive/`.

## Questions and guesses

| | When | How you see it |
|---|---|---|
| blocking question | a wrong guess costs real work | a choice box in the session, and a row in your inbox |
| guess | the companion took an answer in place of a question | the item overview, and `nook eng guesses SHOP-12`, high impact first |

You accept each guess or flip it: `nook eng guess accept SHOP-12 G2` or `nook eng guess flip SHOP-12 G2 --answer "<yours>"`. A flip sends the slices of that guess back to `todo`; the other slices stay done.

## The yolo run

`/yolo SHOP-12` sets the mode `yolo` as the owner and runs the stages alone. It takes the recommended answer of each question and records it as a guess. It passes the plan gate with `proceed`, so it needs no approve from you.

It stops and asks when:

- an answer would drop or narrow what the ticket asks for;
- the spec has a gap that changes what you asked for;
- a step is hard to undo: a push, a migration, a deletion, a breaking contract change;
- a slice failed three times and no other slice can run;
- two review rounds did not meet each criterion;
- the item waits for your accept.

After the run, review its guesses on the item overview. Only you set the mode. An agent never starts a yolo run. While the run goes, the Stop hook holds the session at most six times in a row, so the run does not end in the middle of a stage.

The run belongs to the session where you typed `/yolo`. Another session on the workspace is never held on it. When that session ends, type `/yolo SHOP-12` in a new session to go on. A key with a space, such as `/yolo SHOP 12`, names `SHOP-12`.

## Sessions

| You type | It does |
|---|---|
| `/pickup SHOP-12` | this session leads the item; it shows the state, the last hand-over note, what blocks it, and the next command |
| `/handoff SHOP-12` | writes `works/SHOP-12/handoff.md`: State, Done, Next, Open, Guesses, Watch |
| `/write-walkthrough SHOP-12` | writes `works/SHOP-12/walkthrough.md`: what works now, the key code, how to try it; the Walkthrough tab of the item shows it |
| `/pr` | opens a pull request for the branch, with the criteria of the item; it asks before it pushes |

The ledger in `.nook/engineering.db` is the memory. After a restart or a compaction, `/pickup` reads it, not the chat.

## Change your mind

| You want to | Command |
|---|---|
| change the plan after the approve | `nook eng item replan SHOP-12 --reason "<why>"` |
| change the spec after "Looks right" | `nook eng item reframe SHOP-12 --reason "<why>"` |
| open a done item again | `nook eng item reopen SHOP-12 --reason "<why>"` |
| stop for an outside reason | `nook eng item block SHOP-12 --reason "<why>"`, then `unblock` |
| drop the item | `nook eng item cancel SHOP-12 --reason "<why>"`; `restore` brings it back to the backlog |

## What the guards hold

A guard blocks only for safety and for your moves. The rest shows at the door of a move, and the move still runs.

| Kind | Example | Effect |
|---|---|---|
| block | an agent reads a secret; a builder edits outside the area of its slice; a reader writes a file; an agent runs `approve` | the call stops, with the fix |
| move guard | submit while a slice is not done; approve while a blocking question is open | the move is refused, with the fix |
| door note | the plan changed after the approve; a file changed outside a slice; begin on `main` | the note shows at the move; the move runs |

## What the rules hold

These are rules for the companion, not guards. A hook does not block them.

- The companion commits only when you ask, with `nook eng item commit`.
- The companion pushes only when you ask, as with `/pr`. A `git push` asks you first, and a forced push is denied.
- The budget in `nook.yml` picks how many agents a skill starts.

The full contract is in [the engineering reference](../reference/engineering.md).
