---
name: learn-setup
description: "Set up a course in learn/<course>/: the goal, the date and the minutes each day, the map and the ruler, a placement for each skill from a real task, the roadmap with its monthly milestones. Use when the owner types /learn-setup <course>."
argument-hint: "<course>"
disable-model-invocation: true
allowed-tools: Bash(nook learn *), Read, Write, Edit, AskUserQuestion, Agent
---

Goal: a roadmap that the owner agrees with, where each level rests on a task that the owner did.

## Order
1. Run `nook learn course new <course>`. It makes the files; a file that exists stays.
2. Read `roadmap.md`. Ask once with AskUserQuestion only what it does not hold: the goal (a level and a date), the minutes each day, the skills of the course, and whether captures are on. Recommend the answer of the plan first.
3. Name the map and the ruler. The map gives the levels in can-do words, such as CEFR for a language. The ruler is the measure of the real test, with its criteria, such as the IELTS band descriptors.
4. Place each skill with one short task of the real test.
   - A task that the owner writes, such as a letter: start the `nook-learn:coach` agent with the task, the answer and the ruler. Log its scores with `nook learn score add`.
   - A task that the agent can give in chat, such as a short reading passage with questions: score it against the key.
   - A skill that the agent cannot test in chat, such as listening: take the last real or practice score of the owner, or the owner's own estimate, and write which one it is.
5. Write `roadmap.md`: In short, Goal, The map and the ruler, Levels now (each level with its task), Milestones (one row for each month to the date), The loop (how the minutes of a day split), Captures.
6. Show the roadmap and ask the confirm question: "Looks right" or "Adjust a part". Report the first step: `/learn-today <course>`.

## Gotchas
- A level with no task behind it is a guess. Write it as one.
- Keep the milestones within the minutes of a day. A plan that needs more time than the owner gives is not a plan.
- A skill that the owner took out of the course stays out, also when the real test has it.
- Captures stay off unless the owner says yes in step 2.
