# Plan: kinds and their flows

> In short: each kind of item gets one flow file that says what the kind needs, and the guards read it. A fix needs its repro and a root cause before review. An investigation leaves results, with code or with none. A sub-bug is an item under its story, and the story waits for it. The workspace learns the kind of each ticket type from the answers of the owner, with no vendor and no setup.

## Why

- The rules of a kind live in five guard files as `if (investigate)` checks. A new rule for a kind adds a sixth check in a seventh place.
- A fix gets the documents of a feature. Nothing asks for the steps to reproduce, the actual and the expected result, or the root cause.
- A bug that QA finds inside a story has no place. The story can reach done while its sub-bug is open.
- A tracker has many types, such as `Story`, `Bug`, `Sub-Bug` and `Kaizen`. Nook does not read the type, so triage guesses the kind again.

## What changes

| Part | Today | After |
|---|---|---|
| kinds | `feature`, `fix`, `chore`, `investigate` | the same four kinds |
| rules of a kind | `if` checks in five guards | one flow file for each kind in `plugins/engineering/flows/`; each guard reads the flow of the item |
| fix | the documents of a feature | `spec.md` has `## Reproduce`, `## Actual` and `## Expected`; `submit` needs `root-cause.md` |
| investigation | questions, `findings.md`, no slices | questions, `findings.md` with a `## Results` part; slices and areas are optional |
| sub-bug | no place | an item of kind `fix` with a `parent`; the `accept` of the parent waits for each open child |
| ticket types | not read | the workspace learns the kind of each type (`nook eng kind set`); `item new --type` uses it; a source can skip the types with no local work |
| metrics | no root cause | `nook eng metrics` and `nook retro` count the root causes of the fixes |

## The flow file

A flow file is data. It can use only the rules that the code knows, and `nook doctor` names a rule that it does not know.

```yaml
# plugins/engineering/flows/fix.yml
kind: fix
spec:
  sections: [Reproduce, Actual, Expected]   # each has text before agree
  criteria: required
slices: required
areas: required
submit:
  - root-cause                              # works/<id>/root-cause.md is filled
```

```yaml
# plugins/engineering/flows/investigate.yml
kind: investigate
spec:
  sections: [Questions]
  criteria: none
slices: optional        # code or no code
areas: optional
submit:
  - findings            # each question has an answer; Results names what the work left
```

| Rule | Values |
|---|---|
| `spec.sections` | the headings that `spec.md` needs, each with text |
| `spec.criteria` | `required` or `none` |
| `slices`, `areas` | `required`, `optional` or `none` |
| `submit` | the extra checks of `submit`: `root-cause`, `findings` |

The flows of `feature` and `chore` hold the rules of today. The first slice moves the rules of today into the four files and changes no behavior.

## The root cause of a fix

- A fix writes `works/<id>/root-cause.md`: front matter `type`, and the analysis in a few lines under it.
- `submit` refuses a fix with no file, no `type` or no analysis. The refusal names the file to write.
- A workspace lists its types in `nook.yml` as `engineering.rootCauses`. With a list, `submit` refuses a type that is not on it and names the list. With no list, any type passes.
- `engineering.unknownRootCause` names the type that means "not known yet", such as `Unknown`. That type passes only with a `reason` in the front matter.
- `submit` copies the type into the ledger, so the metrics count it.
- The action that prevents the cause comes from a team session later. Nook does not ask for it.

## Sub-bugs

- An item has a `parent`: the item that it belongs to. A migration of the ledger adds the column.
- The pull of a ticket writes its parent, when the tracker gives one, as a row of Fields. `/intake` sets the `parent` of the item from it.
- `accept` of an item refuses while one of its children is open, and names each child.
- `nook eng item detach <id> --reason <r>` takes a child out of its parent, such as a minor sub-bug for a later sprint. The ledger records the reason.

## Ticket types

- The pull writes the type of a ticket as a row `Type:` of Fields. A pasted ticket with a `Type:` line works the same.
- The ledger keeps the kind of each type that the workspace learned: `nook eng kind set Sub-Bug fix`. No vendor is in the map.
- `item new --type Sub-Bug` with no `--kind` takes the learned kind. Triage takes it as its first answer.
- A type that the workspace does not know: triage decides from the ticket, and `/spec` asks once to keep the kind of that type.
- A source can list `skip`, such as `[Release, Test]`: a pull of such a type stops, with no local work. Every other type is pulled.

## Order

| # | Slice | Proof |
|---|---|---|
| F1 | the four flow files and their reader; each guard asks the flow; no change of behavior | the tests of today pass; a test per rule of the reader; `nook doctor` names an unknown rule |
| F2 | the fix: the three sections and `root-cause.md` at submit, the list of the workspace | K3 to K8 |
| F3 | the investigation: `## Results`, and slices and areas optional | K9 to K11 |
| F4 | the parent: migration, `accept` waits, `item detach` | K12 to K15 |
| F5 | the ticket types: the learned map, `item new --type`, `skip`, the parent row | K16 to K19 |
| F6 | the metrics and the retro count the root causes | K20 |
| F7 | the guide, the reference, the report, the skills (`/spec`, `/close`, triage) | `nook ste`; `bun run check` |

## Out of scope

- A flow file of a workspace that replaces the flow of the pack.
- The bug type and the escape reason: QA sets them in the tracker.
- Any write to the tracker, and a link of slices to the sub-items of the tracker. Slices stay local.
- Environments and deploys.
- The preventive actions of the team session.

## Risks

| Risk | What stops it |
|---|---|
| F1 changes a rule while it moves | F1 changes no test of today; a test that changes shows a moved rule |
| an open fix of today meets the new submit check | the refusal names `root-cause.md` and its shape; the fix is a few lines |
| a workspace list of root causes reaches the public repo | the list lives only in the `nook.yml` of the workspace; the docs use a sample list |
| the tracker gives the parent in another shape | the reader takes the documented `parent` field; a pull on a workspace with a Jira login checks it |
