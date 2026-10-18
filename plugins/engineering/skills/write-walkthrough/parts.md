# The parts of a walkthrough

## Where it goes
- An item: `works/<id>/walkthrough.md`.
- No item: `works/<date>-<slug>/walkthrough.md`, for example `works/2026-10-15-export-retry/walkthrough.md`. The slug is two to four words of the subject.
- Never `/tmp`, an area folder or `~/.claude`. The edit hook blocks an area folder with no running slice.

## No item
The subject is a prompt: a question about the code, or the open changes of the desk.
- `nook eng area status` lists each area with its branch and its dirty files.
- A question about a mechanism: read the code that answers it, from the entry point to the effect.
- Open changes: read `git -C <folder> diff HEAD` and the commits of the branch against its base.
- With no item there is no ledger and no branch for the page to read, so you write every part: "What works now" becomes "What it does", then `## How it works` with a mermaid flowchart of the mechanism, and `## What changed` with a ```tree block of the files.

## What you write, and what the page adds
The walkthrough explains what was built, so the owner catches up without the code. You write the parts that need a reader of the code. The page adds the parts that come from data, so they never drift from the truth:

| Part | From |
|---|---|
| What changed: the files by folder, each with its mark | the diff of the branch |
| Requirements met | the criteria that the ledger marks as met |
| the counts of the tests | the last verify run |

The walkthrough holds no copy of the plan: no flow, no sequence, no data model, no contract. A build that left the plan ran `nook eng item replan` before the review, so the plan says what was built. The walkthrough never lists the differences.

## The six parts that you write
### In short
A quote that starts with `In short:`. Two or three sentences: what works now, and what does not work yet.

### What works now
One line for each piece that works, as `- **Piece:** text`. In plain words: what a person or a caller can do now, how it works in one or two sentences, and why it is safe.
```
- **Charge a saved card:** the page sends only a card id; the api finds the token and charges it. Each payment gets one key, so a second click never charges twice.
```

### Where to start reading
A numbered list of the two to four files to read first, in that order, each with one reason: `1. `api/src/payments/keys.ts`: the key that every charge rests on.`

### How it is built
One to three short excerpts of the code, each in a fenced block with its language, six lines or fewer. Before each excerpt, one sentence says why the code is so.

### Try it
The manual checks as a numbered list. In each step, the first sentence says what to do, and the next sentence says what the owner must see. Give no count of tests: the page shows the last verify run.
Agents never start the app, so a visual check is always here.

### Heads up
A limit of the change, a side effect on another feature, a risk in the code. One line each.

## The page
`nook eng item page <id> --tab walkthrough --out works/<id>/page.html` shows `walkthrough.md` in its own tab, next to Spec, Plan and Tasks, and opens on it. The tree and the flowchart render as components of the UI kit. The page is a local file, never an artifact.

## Deep dives
When the owner asks for a deep dive, explain that topic in full: the code, the reason for each choice, an example run.
Append it to the file under `## Deep dive: <topic>`, so the next reader has it too.
