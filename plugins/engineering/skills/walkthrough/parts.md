# The parts of a walkthrough

## Where it goes
- An item: `work/<id>/walkthrough.md`.
- No item: `work/<date>-<slug>/walkthrough.md`, for example `work/2026-10-15-export-retry/walkthrough.md`. The slug is two to four words of the subject.
- Never `/tmp`, an area folder or `~/.claude`. The edit hook blocks an area folder with no running slice.

## No item
The subject is a prompt: a question about the code, or the open changes of the environment.
- `kit eng area status` lists each area with its branch and its dirty files.
- A question about a mechanism: read the code that answers it, from the entry point to the effect.
- Open changes: read `git -C <folder> diff HEAD` and the commits of the branch against its base.
- There is no spec. "Requirements met" becomes "What it does": the goal from the owner's words or the commit messages.

## The six parts
### In short
A quote that starts with `In short:`. Two or three sentences: what the person can do now, and where the work happens.

### What changed
A ```tree block from the diff, not from the plan. A line that ends in `/` is a folder. A file line is the name, its mark and a short note, with two spaces or more between them. The marks are `new`, `changed`, `deleted` and `moved`.
```
bff/
  src/shipments/
    list.ts  changed  reads the status and filters in the query
  migrations/0042_status.sql  new  an index on status
frontend/
  src/shipments/StatusFilter.tsx  new  the status control
  src/shipments/legacy-filter.ts  deleted  the old filter
```

### How it works
One mermaid flowchart of the flow, top to bottom. Mark a part that changed with `(changes)`, a new part with `(new)`, an error path with `(error)`. Put the area first in a label: `bff: list reads the status`.
Then five short steps or fewer, in plain words: who does what, and what comes back.
A side effect that the owner must know goes in a quote that starts with `Need to know:`, under the step it is about.

### Requirements met
One line for each requirement, in plain words, with no grade and no test name.
```
- The list shows only the shipments of the picked status, the newest first.
- An unknown status gets a clear error that names the valid ones.
```

### Try it
The manual checks, with the steps and what the owner must see. Agents never start the app, so a visual check is always here.

### Heads up
A limit of the change, a side effect on another feature, a choice that the owner can still change. One line each.
A `Need to know:` quote stays in How it works, under its step; Heads up holds the rest.

## The page
`kit eng item page <id>` shows `walkthrough.md` in its own tab, next to Spec, Plan and Tasks. The tree and the flowchart render as components of the UI kit.

## Deep dives
When the owner asks for a deep dive, explain that topic in full: the code, the reason for each choice, an example run.
Append it to the file under `## Deep dive: <topic>`, so the next reader has it too.
