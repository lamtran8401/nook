---
name: write-walkthrough
description: "Write walkthrough.md, the explanation of finished work: what works now in plain words, the changed files, where to start reading, the key code, the met criteria, how to try it, the risks. It is the source of the Walkthrough tab of the page. Use in /view. Not for showing the page: /view does that."
argument-hint: "[item id] or a question about the code"
allowed-tools: Bash(nook eng *), Bash(git status *), Bash(git diff *), Bash(git log *), Read, Glob, Grep, Write, Edit
---

Goal: a report of the finished work that lets the owner catch up in minutes: what was built, explained in plain words, and where to look in the code.
The walkthrough explains the work; it does not copy the plan. The owner reads the diff for the lines.
The owner reads it only on the page, never as Markdown. Write it for the page: the tree, the flowchart, the steps.
The parts in full, and the path with no item: `parts.md` (this folder).

## Order
1. Decide the subject:
   - an item id: `nook eng item brief <id>`, `nook eng item ac list <id>`, `nook eng guesses <id>`.
   - a question (`/view how does the export job retry?`): no item. Find the code with `nook eng area status` and a search.
2. Read the work itself: the diff of each area on the branch (`git -C <folder> diff <base>`), or the code that the question names.
   Explain the code that exists, not the plan.
3. Write `walkthrough.md` with the parts of `parts.md`, in their order. 60 lines or fewer for size S and M, 90 for size L; the tree of What changed does not count. It is the source of the page, as `spec.md` is the source of the Spec tab.
4. Return the path to `/view`. It builds the page.

## The parts that you write
```
> In short:                 what works now, and what does not work yet
## What works now           one line for each piece that works, in plain words: what, how, why it is safe
## What changed             a tree of the changed files by folder, each with its state and its job
## Where to start reading   the two to four files to read first, each with one reason
## How it is built          one to three short excerpts of the key code, each with why
## Requirements met         the criteria that the ledger marks as met, in the words of the spec
## Try it                   the manual checks and what the owner must see
## Heads up                 a limit, a side effect, a risk in the code
```
With no item, Requirements met goes and How it works comes after What changed: `parts.md` says how.

## Gotchas
- Report the product, not the process. Never name a slice, a proof, a gate, a review round, an agent or a guess id.
- Give no line numbers. Name a file only in What changed and in Where to start reading.
- Copy nothing from the plan: the flow, the sequence, the data model and the contract stay there. A build that left the plan needs `nook eng item replan` before the review, never a list of differences here.
- An excerpt shows the idea, not the file: six lines or fewer, the line that holds the decision.
- Write the file under `works/`, never in `/tmp` or in an area folder.
- The walkthrough does not decide. The verdict stays with the reviewer and the owner.
- A prompt with no item: do not invent a mechanism that the code does not have. "Not found" is an answer.
