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
- There is no spec. "How each AC is met" becomes "What it does": the goal from the owner's words or the commit messages, where the code does it, the evidence.
- The verdict says that no plan and no review exist for this change.

## The six parts
### The verdict
Five lines or fewer: the verdict of `/check`, the weakest evidence, and the one thing the owner must look at.
In an auto run, say first that the lead passed the plan gate and the owner did not read the plan.

### What changed
A tree from the diff, not from the plan:
```
bff
  src/shipments/list.ts        reads `status`, filters in the query (T1, AC1 to AC3)
  src/shipments/list.test.ts   3 new cases (T1)
  migrations/0042_status.sql   index on status (T1)
frontend
  src/shipments/StatusFilter.tsx   new control (T2, AC1)
  src/shipments/ShipmentList.tsx   sends the status; the banner on error (T2, AC4)
  src/shipments/export.ts          passes the status to the export (T2, AC5)
```

### One request, step by step
One real request or user action through the changed code. Number the steps. Give `file:line` for each. Mark the new lines.
```
1. The shipper picks "delivered" in StatusFilter.tsx:22 (new).
2. ShipmentList.tsx:41 calls GET /shipments?status=delivered (new parameter).
3. bff list.ts:42 validates the status against the public list (new) and list.ts:51 adds it to the query (new).
4. The rows come back; ShipmentList.tsx:58 renders them. On an error, ShipmentList.tsx:60 shows "Unable to filter" (new).
```
A callout goes where the owner reads the part it is about:
```
   > Need to know: export.ts:31 reuses this call, so the export now returns the filtered rows. Tell support.
```

### How each AC is met
| AC | Where | Evidence | Grade |
|---|---|---|---|
| AC1 the 5 public statuses | `list.ts:40-48` | `list.test.ts:42` fails on the base | run |
| AC4 the banner | `ShipmentList.tsx:60` | `ShipmentList.test.tsx:60` asserts the text | run |
| AC4 the banner on the page | the page | the owner looks | owner |

### Try it
The manual checks, with the steps and what the owner must see.
Agents never start the app, so a visual check is always here.

### Need to know
Each item with where to look: a guess (`kit eng guesses <id>`), a deviation from the plan, a thing with no test, a side effect on another feature.
An item that fits a part above goes there as a callout; the rest goes here.

## The page
The visual pack renders the same parts as one HTML page in the same folder, with the diff and its notes next to the lines and one diagram of the mechanism.
Without the visual pack, offer no page; the Markdown file is the walkthrough.

## Deep dives
When the owner asks for a deep dive, explain that topic in full: the code with its lines, the reason for each choice, an example run.
Append it to the file under `## Deep dive: <topic>`, so the next reader has it too.
