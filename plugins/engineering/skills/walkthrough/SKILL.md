---
name: walkthrough
description: "Write work/<id>/walkthrough.md for the owner's review of a built item, or of code named in a prompt: the verdict, what changed, one request step by step, each criterion with its grade, try it, need to know. Use when the owner says walk me through."
argument-hint: "<item id> or a question about the code"
disable-model-invocation: true
allowed-tools: Bash(kit eng *), Bash(git status *), Bash(git diff *), Bash(git log *), Read, Glob, Grep, Write, Edit
---

Goal: a review that the owner does in minutes and trusts: what changed and why, how it works now, where each criterion is met, what to check by hand.
A walkthrough that hides a change makes the accept blind.
The parts in full, and the path with no item: `parts.md` (this folder).

## Order
1. Decide the subject:
   - an item id: `kit eng item brief <id>`, `kit eng task list <id>` with the files of each slice, `kit eng item ac list <id>` with the marks, `kit eng guesses <id>`, `kit eng item verify <id> --last`.
   - a prompt (`/walkthrough how does the export job retry?`): no item. Find the code with `kit eng area status` and a search. The file goes to `work/<date>-<slug>/walkthrough.md`.
2. Read the work itself: the diff of each area on the branch (`git -C <folder> diff <base>...<branch>`), or the code that the prompt names.
   Explain the code that exists, not the plan.
3. Write `walkthrough.md` with the six parts of `parts.md`, in this order: the verdict, what changed, one request step by step, how each AC is met, try it, need to know. 200 lines or fewer.
4. Report in chat: five lines with the verdict and the path. Then one question: a page now, later or not at all. The HTML page comes with the visual pack; without it, the Markdown file is the walkthrough.

## The six parts, in short
```
## The verdict          the verdict of /check (or "no review exists" for a prompt) and the weakest evidence, five lines or fewer
## What changed         a tree: area → file → the change, with the slice and the ACs it serves
## One request          one real request or user action through the changed code: numbered steps with file:line; new lines marked
## How each AC is met   AC → where (file:line) → the evidence and its grade
## Try it               the manual checks and what the owner must see
## Need to know         a guess, a deviation from the plan, a thing with no test, a side effect: each with where to look
```

## Gotchas
- Every claim has a place: a file and a line, or a test. A wrong step is worse than none.
- Pick one request that touches most of the change. A walk through every path is a second diff.
- Where the code differs from the plan, say so under Need to know. Do not explain the plan as if it were the code.
- Do not paste whole files. Quote the lines that matter.
- Write the file under `work/`, never in `/tmp` or in an area folder. The owner must find it again.
- The walkthrough does not decide. The verdict stays with the reviewer and the owner.
- A prompt with no item: do not invent a mechanism that the code does not have. "Not found" is an answer.
