---
name: wiki-ask
description: "Answer a question from the wiki: the index first, then only the pages whose line matches, an answer in a few lines with a link to each page. Use when the owner asks what the wiki says, or asks why or how about a known topic. Not to add a page: wiki-add."
argument-hint: "<question>"
allowed-tools: Bash(nook wiki *), Read, Glob, Grep
---

Goal: the answer that the wiki holds, with the pages that hold it, and nothing that it does not hold.

## Order
1. Run `nook wiki shelves`. Read `docs/wiki/INDEX.md`, then the `INDEX.md` of each shelf that can hold the answer.
2. Pick the lines that match the question: the topic, a term, a system. Open only those pages.
3. A large wiki or a question across many pages: start the Agent tool with `subagent_type: nook-wiki:librarian` and the question.
4. Answer in a few lines. Give a link to each page that you used, as `(wiki: resources/shipments-api.md)`.
5. No line matches: say "not in the wiki". Name the question as a candidate page for `/wiki-add`.

## Gotchas
- Never answer from memory with no page. A fact with no page is not in the wiki.
- Quote the page where the words matter. Do not make a page say more than it says.
- A page that disagrees with the code or with another page is a finding: name both, and offer `/wiki-tidy`.
