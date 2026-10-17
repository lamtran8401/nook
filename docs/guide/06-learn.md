# 6. Learn

> In short: a **course** takes you to a level against a real standard, in the minutes that you give each day. `/study` takes one topic until you can explain it. The record of each course stays in `learn/<course>/`.

## A course

A course has a map and a ruler:

| Part | What it is | Example for English |
|---|---|---|
| the map | the levels in can-do words | CEFR: B2 "can write a clear letter that gives reasons" |
| the ruler | the measure of the real test, with its criteria | the IELTS band descriptors: Task Achievement, Coherence and Cohesion, Lexical Resource, Grammatical Range and Accuracy |
| the goal | a level and a date | IELTS General band 7 by June |
| the minutes | the time of each day | 20 minutes |

## Set up a course

Type `/learn-setup english`:

1. Nook makes the files of the course. A file that exists stays.
2. The companion asks once: the goal, the date, the minutes each day, the skills, and whether captures are on.
3. It places each skill with one short task of the real test. A coach agent scores a written task on each criterion.
4. It writes `roadmap.md`: the levels now, one milestone for each month, and how the minutes of a day split.
5. You confirm the roadmap or change a part.

A level with no task behind it is a guess, and the roadmap says so.

## Each day

Type `/learn-today english`. The session ends at the minutes of the roadmap.

| Part | What happens |
|---|---|
| cards | each card that is due: you answer, then see the back, then mark it known or missed |
| lesson | one point on your top mistake pattern: your own sentence first, the fix, the rule in one line, three to five drill items |
| output | one short task of your own, such as a message of 5 to 8 sentences about your day |

Each mistake goes into `mistakes.md` as you wrote it, with its pattern and the fix. Each new point becomes a card. A part that time cuts comes first next time.

A card comes back the next day. Known moves it up a box: it comes back after 2, 4, 8, then 16 days. Missed sends it back to the first box.

## Each week

Type `/learn-practice english writing task 2`. You get one task as the real test gives it: the prompt, the time and the length. The coach agent gives a band for each criterion, and quotes the words of your answer that each band rests on.

The scores help; they do not decide. You judge your level.

## One topic

Type `/study <topic>`, such as `/study the present perfect`:

1. The facts: what it is, when it applies, one real example, the most common mistake.
2. You explain it in your own words. The companion corrects only what is wrong.
3. You give one example from your own work or day.
4. Two or three short questions check it.
5. A concept page for the wiki shelf `resources/`, written after your yes.

## The record

```
learn/english/
├── roadmap.md      the goal, the map and the ruler, the levels now, the milestones, the loop, captures
├── mistakes.md     | Date | Pattern | Yours | Fix |
├── scores.md       | Date | Task | Criterion | Band | Evidence |
├── cards/cards.md  | Id | Front | Back | Box | Due | Last |
└── study.md        | Date | Topic | Page |
```

The skills write these files through `nook learn`, never by hand. `nook learn today english` prints the day: the cards due, the top patterns, and if today is practised.

## Two rules

- **Captures.** With captures off, the course uses only what you give in the session. With captures on, it can also read your other text for the course.
- **Work chat.** Corrections of your language happen only inside a course session. The work chat stays free of them.

The full contract is in [the learn reference](../reference/learn.md).
