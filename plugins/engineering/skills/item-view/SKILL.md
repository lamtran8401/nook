---
name: item-view
description: "Show the spec, plan, tasks and walkthrough of an item as one local page in the Bench UI kit, work/<id>/page.html: the diagrams of the plan, the lanes of the slices, the audit dates. Use only when the owner asks for a page, a view or a diagram of an item."
argument-hint: "[item id]"
allowed-tools: Bash(kit eng *), Read
---

Goal: the owner reads an item on any screen, a phone too, and sees its shape at once: what it is for, how it is built, who builds what and when.
The Markdown files stay the record. The page is a view of them, built by the tool, never edited by hand.

## Order
1. Run `kit eng item brief <id>`. The item needs at least `spec.md`; a page with no plan shows the spec only.
2. Build the page into the folder of the item: `kit eng item page <id> --out work/<id>/page.html`.
   The owner asked for one tab, such as the plan: add `--tab plan`. A new build replaces the old file.
3. Never publish the page as an artifact. It stays on the owner's disk, and the owner opens it in a browser.
4. Report in two lines: the path, and what the page holds (the files it found, the date of the last change of each).

## What the page holds
- A header with the id, the title, the state, and the audit line: the dates of start, agree, approve, begin, submit and accept, from the ledger, and the `updated` date of each file.
- The tabs Spec, Plan and Tasks, and Walkthrough when `walkthrough.md` exists, with the files rendered in the components of the Bench UI kit.
- Each flowchart and sequence diagram as nodes of the UI kit; a mermaid block of another kind stays mermaid.
- In the Tasks tab, the lanes of the slices: one group for each area, the `depends` as edges, and which slices run beside each other.

## Gotchas
- Never write a fact in the page that is not in the files or in the ledger. A wrong page is fixed in the Markdown, then built again.
- The page is a local file. To send it to someone, the owner sends the file; never publish it for the owner.
- The page script draws the edges of a flowchart and a sequence diagram. A mermaid block of another kind shows its source.
- Make the page only on request, or at the end of `/walkthrough`. The record does not need it.
