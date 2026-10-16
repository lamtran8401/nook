---
name: wiki-tidy
description: "Find what is wrong in the wiki: broken links, pages with no index line, lines with no page, two pages on one topic, pages with no source, adjectives with no example. Fix the mechanical part after one yes; list the rest. Use when the owner says tidy the wiki, or after many pages changed."
disable-model-invocation: true
allowed-tools: Bash(kit wiki *), Read, Glob, Grep, Edit, AskUserQuestion
---

Goal: a wiki that the agents can trust: each page found through the index, each link alive, one page for each topic.

## Order
1. Run `kit wiki index` and `kit wiki links`. Each line they print is a finding.
2. Read each shelf index. Two lines on one topic are a finding: name both pages.
3. Read the pages of `resources/`. A page with no source, and a quality word ("fast", "simple", "modern") with no example, are findings.
4. Sort the findings. Mechanical: a missing index line, a link to a page that moved. For the owner: a merge (offer `/wiki-merge`), a delete, a page with no source, an adjective with no example.
5. Ask the owner once with AskUserQuestion: fix the mechanical findings now. On yes, run `kit wiki index --fix` and fix each moved link; then run both checks again.
6. Report the fixed findings with their count, and the list for the owner.

## Gotchas
- Never delete, move or merge a page without the owner's yes.
- A line with no page can be a page that the owner moved. Ask before you remove the line.
- Do not rewrite a page for style. Tidy fixes the wiki, not the words of the owner.
