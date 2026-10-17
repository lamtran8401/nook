---
name: view
description: "Show the owner an item, or the answer to a question about the code, as one local page in the Bench UI kit: work/<id>/page.html, open on the tab of the state. Writes the walkthrough first when the work is built. Use when the owner types /view."
argument-hint: "[item id] or a question about the code"
disable-model-invocation: true
allowed-tools: Bash(kit eng *), Bash(git status *), Bash(git diff *), Bash(git log *), Read, Glob, Grep, Write, Edit
---

Goal: the owner reads an item at any stage on one page, and never opens a Markdown file.
The Markdown files are the source, for the agents. The page is the view of them, built by the tool, never edited by hand.

## Order
1. Decide the subject:
   - an item id, or no words: the item, as the core rule says for a command with no argument.
   - other words: a question about the code. Go to "A question" below.
2. Run `kit eng item brief <id>`. The item needs at least `spec.md`.
3. In `review` or `done`, the page opens on the walkthrough. Write it with `write-walkthrough` when it is missing, or when the code changed after its `updated` date.
4. Build the page: `kit eng item page <id> --out work/<id>/page.html`.
   It opens on the tab of the state: Spec in framing, Plan in planning and ready, Tasks in cooking, Walkthrough in review and done.
   The owner named a tab, as "/view IT-3 plan": add `--tab plan`.
5. Report in two lines: the path of `page.html`, and what it holds (the tabs, and the date of the last change of each file).

## A question
1. Write the walkthrough of the question with `write-walkthrough`, into `work/<date>-<slug>/walkthrough.md`.
2. Build its page: `kit eng doc page work/<date>-<slug>/walkthrough.md --out work/<date>-<slug>/page.html`.
3. Report the path of `page.html`.

## What the page holds
- A header with the id, the title, the state, and the audit line: the dates of start, agree, approve, begin, submit and accept, and the `updated` date of each file.
- The tabs Spec, Plan and Tasks, and Walkthrough when `walkthrough.md` exists, in the components of the UI kit.
- Each flowchart and sequence diagram as nodes of the UI kit. A mermaid block of another kind shows its source.
- In the Tasks tab, the lanes of the slices: one group for each area, the `depends` as edges.

## Gotchas
- Never publish the page as an artifact. It stays on the owner's disk; to share it, the owner sends the file.
- Never write a fact in the page that is not in the files or in the ledger. A wrong page is fixed in the Markdown, then built again.
- Report only the path of `page.html`. Do not paste the Markdown into the chat.
- A new build replaces the old file. Build again after a document changes.
