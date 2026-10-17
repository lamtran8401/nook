# The learn pack

> In short: a course takes the owner to a level against a map and a ruler, in the minutes of a day. The record of a course is plain Markdown in `learn/<course>/`; the skills write it through `nook learn`.

This file states how the code works now. The code is in `packages/learn/`; the plugin is `plugins/learn/`.
The home of the courses is the nearest desk above a folder that turns `learn` on.

## The section of nook.yml

```yaml
learn:
  dir: learn        # the folder of the courses: <home>/learn/<course>/
```

`/setup` writes the section. A course gets its files with `/learn-setup <course>`.

## The files of a course

| File | Holds | Columns |
|---|---|---|
| `roadmap.md` | In short, Goal, The map and the ruler, Levels now, Milestones, The loop, Captures | Levels: `Skill`, `Level`, `From the task`; Milestones: `Month`, `Target` |
| `mistakes.md` | the owner's mistakes, as written | `Date`, `Pattern`, `Yours`, `Fix` |
| `scores.md` | the scores on the criteria of the ruler | `Date`, `Task`, `Criterion`, `Band`, `Evidence` |
| `cards/cards.md` | the cards in boxes | `Id`, `Front`, `Back`, `Box`, `Due`, `Last` |
| `study.md` | the topics studied, each with its wiki page | `Date`, `Topic`, `Page` |

`nook learn course new <course>` makes each missing file. A file that exists stays.
The `Captures` section of the roadmap is `off` until the owner turns it on.

## The cards

| Box | The card comes back after |
|---|---|
| 1 | 1 day |
| 2 | 2 days |
| 3 | 4 days |
| 4 | 8 days |
| 5 | 16 days |

- A new card starts in box 1. Its id is `C` and the next number: `C1`, `C2`.
- `good` moves a card up one box, to box 5 at most.
- `again` sends a card back to box 1.

## Commands

The course argument can go when the desk has one course.

| Command | What it does |
|---|---|
| `nook learn courses` | the courses of this desk, each with its cards due today |
| `nook learn course new <course>` | makes the files of a course |
| `nook learn today [course]` | the cards due, the top patterns of the mistakes, and whether today is practised |
| `nook learn card add [course] --front <text> --back <text>` | adds a card; it comes back the next day |
| `nook learn card review [course] <id> good\|again` | marks a card known or missed |
| `nook learn mistake add [course] --pattern <name> --yours <text> --fix <text>` | logs a mistake: its pattern, the sentence as written, the fix |
| `nook learn top [course] [--n 3]` | the patterns that come back most |
| `nook learn score add [course] --task <name> --criterion <name> --band <n> --evidence <words>` | logs a score on one criterion, with the owner's words that it rests on |
| `nook learn study add [course] --topic <text> --page <path>` | logs a topic, with its page in the wiki |

## Skills and agent

| Name | Who starts it | What it does |
|---|---|---|
| `/learn-setup <course>` | the owner | the goal, the date, the minutes, the map and the ruler, a placement for each skill from a real task, the roadmap |
| `/learn-today [course]` | the owner | the cards due, one lesson on the top pattern, one short task of the owner; ends at the minutes of the roadmap |
| `/learn-practice [course] <task>` | the owner | one timed task like the real test, then a band for each criterion with its quote |
| `/study <topic>` | the owner | the facts, the owner's explanation and example, a check, a concept page after a yes |
| `learn-cards` | `/learn-today` | shows each due card, then marks it good or again |
| `learn-lesson` | `/learn-today` | the owner's sentence, the fix, the rule in one line, three to five drill items |
| `coach` | `/learn-setup`, `/learn-practice` | scores one answer on each criterion of the ruler with quotes; never rewrites it |

## The rules

`templates/rules/learn.md` goes to `.claude/rules/nook/learn.md` with `nook init`:

- Write the record through `nook learn`, never by hand.
- A mistake is the owner's own words. Never log an invented example as the owner's.
- A score names its criterion and quotes its words. The owner judges the level.
- Teach the example before the rule.
- Keep to the minutes of the roadmap.
- Read the owner's other text only when captures are on.
- Correct the owner's language only inside a course session.
