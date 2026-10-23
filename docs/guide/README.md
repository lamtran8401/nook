# The guide book

> In short: this book shows how to use Nook, one task for each chapter. Read chapter 1 first; read the other chapters when you need them.

Nook is a base layer for Claude Code. You run `nook init` in a folder, and that folder becomes a **desk**. On a desk, Claude Code works with your rules, your record and your knowledge.

| Chapter | Read it when |
|---|---|
| [1. Start](01-start.md) | you install Nook and make your first desk |
| [2. Desks](02-desks.md) | you want two desks, a child desk, or a pack off |
| [3. A day with Nook](03-day.md) | you start a day, answer a question, or decide at a gate |
| [4. Work](04-work.md) | you take a ticket to a result that you accept |
| [5. The wiki](05-wiki.md) | you keep what you learn, or ask what you know |
| [6. When something blocks](06-blocks.md) | a guard stops a call, or `nook doctor` shows a gap |

## Three promises

| Promise | What you get | Example |
|---|---|---|
| Work | Agents take an item to a result that you accept, with evidence that you can check. | `SHOP-12` goes from a ticket to a branch with tests. You type `/gate accept SHOP-12`. |
| Learn | You learn a subject against a real standard, or one topic until you can explain it. | An English course to IELTS band 7, ten minutes each day. |
| Grow | What you learn and decide goes into one wiki. You and the agents read it. | The lesson of an article becomes a page in `resources/`. |

## Words of this book

| Word | Meaning |
|---|---|
| desk | a folder with `nook.yml` |
| pack | a set of rules, skills and agents for one kind of work: core, engineering, wiki, learn |
| owner | you, the person who uses Nook |
| companion | the main Claude Code session on a desk, with the persona `nook-companion` |
| item | one piece of work with a goal and criteria, such as `SHOP-12` |
| gate | a step that only you take: approve a plan, accept a result |
| guard | a hook that stops a call that breaks a rule, and names the fix |

The exact contracts are in [the reference](../reference/). The state of the build is in [the report](../report.md).
