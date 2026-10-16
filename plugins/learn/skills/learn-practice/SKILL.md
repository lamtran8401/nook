---
name: learn-practice
description: "One timed task like the real test, then a score on each criterion of the ruler with the owner's words that it rests on, from the coach agent; the scores and the mistakes into the record, and the next step. Use when the owner types /learn-practice [course] <task>, once a week."
argument-hint: "[course] <task, such as writing task 2>"
disable-model-invocation: true
allowed-tools: Bash(kit learn *), Read, AskUserQuestion, Agent
---

Goal: an honest score against the real test, with the evidence for each part of it.

## Order
1. Read `roadmap.md`: the ruler and its criteria, and the level of the skill now.
2. Give the task as the real test gives it: the prompt, the time and the length. Say when the time starts. The owner answers in one message.
3. Start the `coach` agent with the task, the answer word for word, the criteria of the ruler and the level now. It returns a band for each criterion, the sentences of the answer that each band rests on, and the top patterns.
4. Check each band of the coach: it quotes the answer and names its criterion. A band with no quote goes back to the coach.
5. Log each criterion: `kit learn score add [course] --task "<task>" --criterion "<criterion>" --band <band> --evidence "<the quoted words>"`. Log each mistake with `kit learn mistake add`.
6. Report: the band for each criterion with its quote, the one change that lifts the lowest criterion, and the next practice task.

## Gotchas
- The coach scores; it never rewrites the answer for the owner. One fixed sentence for each top pattern is enough.
- The owner judges the level. Say that the scores help and do not decide.
- Keep the conditions of the real test: the time, the length, no help during the task.
