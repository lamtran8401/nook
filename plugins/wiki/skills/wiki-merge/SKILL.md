---
name: wiki-merge
description: "Merge related wiki pages into one complete page: the pages of the features of one process or epic become one page with the flow from end to end. The old pages move to the archive after the owner's yes, and their links point at the new page. Use when the owner says merge these pages, or when wiki-tidy finds pages on one topic."
argument-hint: "<the topic, or the pages>"
disable-model-invocation: true
allowed-tools: Bash(nook wiki *), Read, Glob, Grep, Write, Edit, AskUserQuestion
---

Goal: one page that a reader reads in place of many, for a topic that grew one feature at a time.
Example: an epic "checkout" left `cart.md`, `payment.md` and `receipt.md`; the merge gives `checkout.md`, from the cart to the receipt.

## Order
1. Find the pages: the ones that the owner names, or the index lines that match the topic. Read each one in full.
2. Name the merged page and its shelf. Say which pages go in, and which related pages stay out with the reason.
3. Draft the merged page (the format is below). Keep each fact, each pitfall and each History line of the old pages. Two pages that disagree: name both, and ask the owner which one is true now.
4. Show the draft and the list of old pages. Ask the owner once with AskUserQuestion. The options are "Merge" (recommended) and "Stop". The owner types a change to the draft in the field of the host.
5. On yes: write the merged page first. Then run `nook wiki retire <old pages> --into <merged page>`: it moves the old pages to the archive, takes their rows out of the index, and points each link at the merged page.
6. Run `nook wiki index --fix` and `nook wiki links`. Report the merged page, the pages in the archive, and the links that changed.

## The merged page
```
---
type: <the type of the old pages>
---
# <the whole topic, as a noun phrase>
> In short: <what the whole thing does, in one or two sentences>
## How it works         one flowchart from end to end, then each part with its real examples
## Pitfalls             every pitfall of the old pages, in one list
## History              every History line of the old pages, by date, plus "<date>: merged from <pages>"
```

## Gotchas
- A merge keeps every fact. A fact that you leave out is a lost fact; ask before you drop one.
- Write the merged page before `nook wiki retire`; the command refuses a merged page that does not exist.
- The old pages go to the archive, never to nothing. Never delete a page.
- The shelf `areas/` belongs to the owner. Merge its pages only when the owner names them.
