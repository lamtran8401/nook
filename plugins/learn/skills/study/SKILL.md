---
name: study
description: "Understand one topic until the owner can explain it: the facts first, then the owner explains, an example of the owner's, a check; the topic as a concept page of the wiki after a yes, and one line in the study log. Use when the owner types /study <topic>."
argument-hint: "<topic>"
disable-model-invocation: true
allowed-tools: Bash(nook learn *), Bash(nook wiki *), Read, Glob, Grep, Write, Edit, WebFetch, AskUserQuestion
---

Goal: the owner can explain the topic in their own words and use it in an example of their own.

## Order
1. When the wiki pack is on (`nook wiki shelves` answers), read the wiki index. A page on the topic exists: start from it and add to it.
2. The facts: what it is, when it applies, one real example, the one mistake that people make most. Keep it short.
3. Ask the owner to explain it in their own words. Correct only what is wrong, with the reason.
4. Ask for one example of the owner's own, from their work or their day. Check it.
5. One check: two or three short questions that need the topic. Give the answers after.
6. With the wiki pack on: draft a concept page for the wiki shelf `resources/`: In short, the facts, the owner's example, the common mistake, History. Ask the owner once: write it, keep it for later, or drop it.
7. On yes, write the page and run `nook wiki index --fix` and `nook wiki links`. Kept for later: write it into `docs/wiki/drafts/resources/`. Then `nook learn study add [course] --topic "<topic>" --page "<the page>"` when the topic belongs to a course.
8. With no wiki pack: keep the topic as two or three cards of the course, `nook learn card add [course] --front "<question>" --back "<answer>"`, one of them on the owner's example. Write no file of a wiki.

## Gotchas
- A page with no example is not done. The owner's example comes first.
- A large topic needs sources: say so, and split it into shorter sessions.
- Write no page before the owner's yes.
