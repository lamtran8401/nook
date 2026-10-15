---
name: walkthrough
description: "Write the report of work that is done, for the owner: what was built, the changed files as a tree, how it works, which requirements it meets, how to try it. As a Markdown file or as a tab of the item page. Use when the owner says walk me through."
argument-hint: "<item id> or a question about the code"
disable-model-invocation: true
allowed-tools: Bash(kit eng *), Bash(git status *), Bash(git diff *), Bash(git log *), Read, Glob, Grep, Write, Edit, AskUserQuestion
---

Goal: a short report of the finished work that the owner reads in minutes: what was built, how it works, what it meets.
The owner reads the diff for the lines. The walkthrough gives the shape of the change, not the lines.
The parts in full, and the path with no item: `parts.md` (this folder).

## Order
1. Ask the owner one question with AskUserQuestion: a Markdown file, or a page. Make only the one the owner picks.
2. Decide the subject:
   - an item id: `kit eng item brief <id>`, `kit eng item ac list <id>`, `kit eng guesses <id>`.
   - a prompt (`/walkthrough how does the export job retry?`): no item. Find the code with `kit eng area status` and a search.
3. Read the work itself: the diff of each area on the branch (`git -C <folder> diff <base>`), or the code that the prompt names.
   Explain the code that exists, not the plan.
4. Write `walkthrough.md` with the six parts of `parts.md`. 80 lines or fewer.
5. A Markdown file: report the path. A page: run `kit eng item page <id>` (skill `item-view`); the file shows in the Walkthrough tab.

## The six parts, in short
```
> In short:              what was built, in two or three sentences
## What changed          a ```tree block: each file with its mark (new, changed, deleted, moved) and a short note
## How it works          one diagram of the flow, and five short steps or fewer
## Requirements met      one line for each requirement, in plain words
## Try it                the manual checks and what the owner must see
## Need to know          a limit, a side effect, a choice that the owner can change
```

## Gotchas
- Report the product, not the process. Never name a slice, a proof, a gate, a review round, an agent or a guess id.
- Give no line numbers. Name a file only in the tree; the owner reads the diff for the rest.
- Use the components: the tree for the files, a mermaid flowchart for the flow. A table only where a list cannot hold it.
- Pick one request that touches most of the change. A walk through every path is a second diff.
- Write the file under `work/`, never in `/tmp` or in an area folder.
- The walkthrough does not decide. The verdict stays with the reviewer and the owner.
- A prompt with no item: do not invent a mechanism that the code does not have. "Not found" is an answer.
