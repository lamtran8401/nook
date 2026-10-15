---
name: plan-check
description: "Gate before the owner approves a plan: every AC has a slice and a test with a negative case, the sections are filled, the order holds, the ledger lists no gap. Use in /recipe or when the owner asks if the plan is ready. Not the slices: slice-tasks."
argument-hint: "<item id>"
allowed-tools: Bash(kit eng *), Read, Glob, Grep, Edit
---

Goal: a plan that passes the guard of `approve` and holds up in the build.
The approve freezes `spec.md`, `plan.md` and `tasks.md`. A gap found after it needs `kit eng item replan` and a new approve, so be strict now.

## Order
Run `kit eng item check <id>` and read `plan.md`, `tasks.md` and the spec. Name each gap in one line.
1. The ledger: `item check` lists no gap. Every AC is in a slice, each slice has one area of the item, no cycle in `depends`.
2. Sections: Today, Approach, Impact, Proof and Risks have content, and Flow too for size L. A section that holds only the template is empty. The front matter has `approach`, `created` and `updated`.
3. Proof: each AC is in a row, with its layer, the proof in plain words and one negative case. "Add tests" is a gap.
4. Approach against the spec: each AC has a decision or a part of the diagram that meets it. The approach adds nothing that Out of scope excludes.
5. Contract change: the Impact row names each consumer, and the Rollout row ships the contract, then the provider, then the consumers. Else run `contract-check`.
6. Order: the slices follow the Rollout row. A consumer slice depends on its provider slice. Two slices that edit one file are ordered.
7. Slices: each has `area`, `depends`, `acs`, `size`, `done when`. Each is small enough for one builder, test first.
8. Size and level: size M under 60 lines with text, size L under 100 (`grep -c . plan.md`). The plan holds no path:line, no function signature and no code; Today holds facts, and a choice belongs in Approach.
9. Questions: `kit eng questions <id> --open` lists no blocking question.
10. Drift: `spec.md` did not change since `/recipe` started. If it did, tell the owner.
11. Kind `investigate`: a short plan and no slices, as `${CLAUDE_PLUGIN_ROOT}/skills/spec/investigate.md` says.

## Fix or report
- Fix what you can: a missing test line, a missing `depends`, a fact with no path. After a fix to `tasks.md`, run `kit eng task import <id>` again.
- Report what needs the owner: a design choice with a real trade-off, a criterion with no possible check, a breaking contract change with no migration path.
- Run the check again after each fix.

```
plan-check SHOP-12: 2 gaps
- AC4 has no row in Proof. Added: frontend test for the banner text; manual check of the banner. The owner confirms the manual check.
- T2 depends on nothing but needs the bff parameter. Fixed: `depends: T1`.
Passed: item check, sections, order, design against the spec.
```

## Gotchas
- A Proof row that says "add tests" passes the ledger and fails the review. Read the section row by row.
- A plan that passes this check can still be weak: judge the approach too.
- Do not change `spec.md` to make the plan pass. A gap in the spec goes to the owner.
