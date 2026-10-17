---
name: grill-me
description: "Interview the owner about a big decision until the answer that is already in the owner's head is in order: a product direction, a channel, a business plan. One open question at a time, a real example for each adjective, then one record. Use when the owner says grill me, interview me or help me think this through."
argument-hint: "<the decision>"
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Write
---

Goal: the owner's own answer, in order, with its reasons and its open points.
The answer is in the owner's head already. The interview finds it and sorts it. You do not decide.

## Order
1. Say the decision back in one sentence, and what "decided" means here: a choice, a plan, a list of bets. Ask the owner to correct it.
2. Read what exists first: the files that the owner names, and the earlier records in `docs/grill/`.
3. Interview. Ask one short, open question in each turn, in prose. This skill is the exception to the rule of one round with AskUserQuestion, because the answers are open.
   Go in this order, and skip a part that the owner settled: the goal and for whom; the limits (time, money, skills); the options; the criteria; the risks; the first step.
4. Push on each answer that is not clear:
   - An adjective such as "modern", "premium" or "simple": ask for one real example (a product, a channel, a page, a person) and what in it the owner means.
   - A vague answer: ask "How do you know?", "What do you give up for it?" or "What if it fails in three months?".
   - Two answers that disagree: quote both, and ask which one wins.
5. Give an option only when the owner asks for one. Then give two or three, with your recommendation first.
6. After every five questions, and when the owner says stop, say back what you heard in five lines or fewer. Ask what is wrong.
7. Stop when the owner can say the decision in one sentence, or says to stop.
8. Write the record (the format is below). Report the path, the decision line and the open points. Make a page only when the owner asks.

## The record
`docs/grill/<date>-<slug>.md`, or where the owner says. Simplified Technical English; the chat follows the language of the owner.
```
# <the decision, as a noun phrase>
> In short: <the decision in one sentence, in the owner's words>
## Why                 the reasons of the owner, quoted
## Examples            each real example, and what it shows
## Not taken           each option left out, with its reason
## Open                each point with no answer, each adjective with no example
## First step          one step, with a date when the owner gave one
```

## Gotchas
- The decision is the owner's. Never write a conclusion that the owner did not say.
- Quote the words of the owner for the reasons. Do not make them yours.
- One question in each turn. A list of five questions gets five short answers.
- An adjective with no example is an open point, not an answer.
- The record holds personal facts. It stays in the environment of the owner, never in the Nook repo.
