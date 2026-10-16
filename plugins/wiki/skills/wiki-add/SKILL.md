---
name: wiki-add
description: "Keep the lesson of a source in the wiki: the source into docs/references/, a draft page in the shelf resources/ with its main points, a real example for each, the gotchas and the source; written after the owner's yes. Use when the owner says add this to the wiki, keep this, or gives a link or a file to keep."
argument-hint: "<a link, a file, or the text>"
disable-model-invocation: true
allowed-tools: Bash(kit wiki *), Read, Glob, Grep, Write, Edit, WebFetch, AskUserQuestion
---

Goal: a page that the owner and the agents can read later in place of the source, with its examples.

## Order
1. Get the source: fetch the link, read the file, or take the text. A source that you cannot open: say so and stop.
2. Read the indexes (`docs/wiki/INDEX.md` and `resources/INDEX.md`). A page on the same topic gets a change, not a second page.
3. Write the reference: `docs/references/<date>-<slug>.md` with the link, the title, the date, and the main points in your own words. Never copy the source.
4. Draft the page (the format is below). Each point gets one real example from the source or from the work of the owner.
5. Show the draft and ask the owner once with AskUserQuestion: write it, change it, keep it for later, or drop it.
6. On yes: write the page into `resources/`, then run `kit wiki index --fix` and `kit wiki links`. Report the path and the index line.
7. Keep it for later, or no answer before the session ends: write the draft into `docs/wiki/drafts/resources/<page>.md`. `/brief` shows it until the owner decides. On a later yes, move it to its shelf and run step 6; on a no, delete the draft.

## The page
```
---
type: lesson
source: ../../references/<date>-<slug>.md
---
# <the topic, as a noun phrase>
> In short: <the lesson in one sentence>
## Main points        each point, then its real example
## Gotchas            what goes wrong, with an example
## History            <date>: from <the source>
```
Simplified Technical English. The chat follows the language of the owner.

## Gotchas
- A point with no real example is not done. Find the example in the source, or ask the owner for one.
- The reference keeps the link and the points, never the full text. A source behind a login stays a link only.
- Write no page before the owner's yes. A draft in `docs/wiki/drafts/` is not a page: no index names it, and no link counts it.
- The shelf `areas/` belongs to the owner. A lesson goes to `resources/`.
