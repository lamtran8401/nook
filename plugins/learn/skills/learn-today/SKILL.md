---
name: learn-today
description: "The day of a course, in the minutes of the roadmap: the cards that are due, one lesson and drill on the top mistake pattern, one short task of the owner's own output; each mistake into the log, each new point into a card. Use when the owner types /learn-today, or /brief names the course."
argument-hint: "[course]"
disable-model-invocation: true
allowed-tools: Bash(kit learn *), Read, AskUserQuestion
---

Goal: a short daily session that works on the owner's own mistakes and ends on time.

## Order
1. Run `kit learn today [course]`: the cards due, the top patterns, and whether today is practised. Read the minutes and the loop in `roadmap.md`.
2. The cards: run `learn-cards` for each card that is due.
3. The lesson: run `learn-lesson` on the first top pattern. With no mistake yet, take the next point of the roadmap.
4. The owner's own output: give one short task in the skill of the day, as the roadmap's loop names it, such as a message of 5 to 8 sentences about the day.
5. Read the answer. For each mistake, log it: `kit learn mistake add [course] --pattern "<pattern>" --yours "<the words as written>" --fix "<the fix>"`. Use the name of an existing pattern when it fits.
6. A new point that the owner did not know becomes a card: `kit learn card add [course] --front "<the point>" --back "<the answer, with an example>"`.
7. Stop at the minutes of the roadmap. Report: the cards done, the pattern of the lesson, the mistakes logged, and what comes next time.

## Gotchas
- The lesson works on the owner's pattern, not on a topic from a book. A pattern that is not in `mistakes.md` waits.
- Show the fix with the owner's own sentence first, then the rule in one line.
- Do not stretch the session to finish a part. A part that is cut comes first next time.
