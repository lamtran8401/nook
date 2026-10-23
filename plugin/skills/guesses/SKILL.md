---
name: guesses
description: "Review the guesses of an item, high impact first: the owner accepts each one or flips it; a flip returns its slices to todo. Use when the owner says guesses, assumptions, or comes back after a yolo run."
argument-hint: "[item id]"
disable-model-invocation: true
allowed-tools: Bash(nook eng *), Read
---

Goal: the owner has seen and decided every open guess before the item moves on.
A guess is cheap to take and costly to find late. High impact comes first: it can change a contract, data or an AC.

## Order
1. Run `nook eng guesses <id> --open`. An empty list: say so and stop.
2. Run `nook eng next <id>` and `nook eng task list <id>`, so you know what a flip changes: which slices are done, running or todo.
3. For each high-impact guess, say which AC it touches.
4. Ask the owner, four guesses in one call, accept recommended. Each question holds the guess, the answer taken, the other answer, the impact and the slices.
5. Accepted: `nook eng guess accept <id> <G>`. Flipped: `nook eng guess flip <id> <G> --answer "<the owner's answer>"`. Read which slices went back to `todo`.
6. The item is in `review` and slices went back: `nook eng item reject <id> --reason "G<n> flipped"`, so the state follows the slices.
7. A flip that changes the plan (a high-impact guess often does): offer `nook eng item replan <id> --reason "G<n> flipped"` before the slices run again.
8. Run `nook eng next <id>` and report.

## The report
```
Waits for you: nothing. 3 guesses reviewed.
G1 (low) status order by name: accepted.
G2 (high) the filter applies to archived shipments: flipped to "no". T2 back to todo. Touches AC2; the plan holds.
G3 (med) banner text: accepted.
Next: /cook SHOP-40 rebuilds T2. /recipe SHOP-40 first when the flip changes the plan.
```

## Gotchas
- Never decide a guess for the owner because it looks small. Show every one.
- A flip resets only the slices of that guess. The others stay done. Tell the owner how many slices the rebuild covers, so the cost is clear.
- A guess with no slices named still matters: read its answer against the ACs.
- An accepted guess stays in the record. Do not delete the question from the spec or the plan; the answer is now a fact with a source.
