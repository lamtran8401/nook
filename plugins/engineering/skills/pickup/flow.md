# The flow of one item

One owner, one lead session for each open item.
The owner decides at two gates.
The lead does the work between them.
The tool `kit eng` holds the ledger and refuses a move with a gap; each gap comes with its fix.

## States and moves
```
backlog ─start→ framing ─agree→ planning ─approve★→ ready ─begin→ cooking ─submit→ checking ─accept★→ done
                                 └──────proceed (auto run)────┘
checking ─reject→ cooking      done ─reopen→ cooking      ready | cooking | checking ─replan→ planning
planning | ready | cooking | checking ─reframe→ framing      any open ─block→ blocked ─unblock→ the state before
any open ─cancel→ cancelled ─restore→ backlog                 ★ only the owner
```

| Phase | State | Skill | The move at the end | Who |
|---|---|---|---|---|
| Intake | backlog | `/intake` | `start` | lead |
| Framing | framing | `/spec` | `agree` | lead, after the owner confirms the spec |
| Planning | planning | `/recipe` | `approve` | owner, in a terminal |
| Cooking | ready, cooking | `/cook` | `begin`, then `submit` | lead |
| Checking | checking | `/check`, `/walkthrough` | `accept` | owner, in a terminal |
| Close | done | `/close` | none | lead |

## The gates
- `approve` and `accept` are the owner's.
  A skill says "approve in your terminal: `kit eng item approve <id>`" and stops.
  The deny rule and the hook refuse the same command from the model.
- `approve` stores a hash of `spec.md`, `plan.md` and `tasks.md`.
  A change to one of them after the approve blocks `begin`; the fix is `kit eng item replan <id>`.
- A move back (`reject`, `replan`, `reframe`, `reopen`) clears the approval.
  A verify counts only after the last move back.
- `kit eng item check <id>` lists the gaps of the next move with no move.
  Run it before you tell the owner that a gate is ready.

## The three paths
| Path | For | Stages |
|---|---|---|
| quick | a fix or chore in one area, size S, no contract change | `/quick`: one slice, no spec, no plan, test first, the owner accepts |
| standard | everything else | intake, spec, recipe, cook, check, close |
| auto | a standard item in mode `auto` | `/auto`: the lead runs the phases, records each guess, passes the plan gate with `proceed`, stops at the accept |

Kind `investigate` follows the standard path with Questions in place of criteria: `${CLAUDE_PLUGIN_ROOT}/skills/spec/investigate.md`.

## Who does the work
| Who | Jobs | Start |
|---|---|---|
| lead | triage, the spec, the plan, the answers, the moves, a quick item, the reports | itself |
| subagent | scout, verifier, reviewer, code-reviewer, skeptic, the designers: one job, a summary back | the Agent tool with `subagent_type`, no `name`; `run_in_background` when the lead has other work meanwhile |
| teammate | a builder for an area with two or more slices, or an item of size M or L, alive from `begin` to `submit` | the Agent tool with `name: <area>-builder`; see `../cook/brief.md` |

A lone slice goes to a background subagent; a quick item the lead builds itself.
Agent teams are on in every environment. A `name` makes a teammate, so a one-shot job never gets one.

## The question round
Only the lead asks the owner.
A builder parks its slice with `kit eng task wait <id> <T> --reason "<question>"`; the lead brings the question to the owner.
1. Collect every blocking question of the stage before you ask one.
   An answer that a file holds is not a question: read `spec.md`, `plan.md`, the ADRs and the code first.
2. Register each one: `kit eng ask <id> "<text>" --blocking --rec "<recommended answer>"`.
   The record is what lets the Stop hook hold the session while the question is open.
3. Ask them in one AskUserQuestion call, as the core rule says.
4. Record each answer: `kit eng answer <id> Q<n> "<answer>"`.
5. A question that does not block becomes a guess: `kit eng guess <id> "<question>" --took "<a>" --other "<b>" --impact low|med|high [--slices T1,T2]`.

## The confirm question
The spec at the end of `/spec`, and the plan with the slices at the end of `/recipe`, need the owner's word.
Show the document, then ask one question with two options: "Looks right" (recommended) and "Adjust a part".
On "Adjust a part", ask which part, change it, run the check of the stage again, and ask again.
Do not end the turn while the document is not confirmed.
Never ask "shall I proceed" or "do you approve": the gates have their own commands.

## The report of a stage
- Line 1: what waits for the owner, or "Nothing waits for you".
- Then: what changed, with paths; the guesses of the stage; what was not checked.
- Last: the next command to type, and the one or two others that make sense now.
  Check it with `kit eng next <id>`; when they differ, the tool is right.

## Going back
| Case | Move |
|---|---|
| the result is not good enough | `reject --reason` (checking to cooking) |
| the approach is wrong | `replan --reason`; done slices stay |
| the requirements changed | `reframe --reason`; back to the spec |
| a blocker outside the item | `block --reason`, later `unblock` |
| not worth doing | `cancel --reason`; `restore` brings it back |
| a done item was not done | `reopen --reason` |
| an urgent change during a build | write it in the spec, then `reframe`; never slip it into a running build |
