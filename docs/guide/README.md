# The guide book

> In short: this book shows how to use Nook, one task for each chapter. Read chapter 1 first; read the other chapters when you need them.

Nook is a harness kit for a developer in Claude Code. You run `nook init` in a folder, and that folder becomes a **workspace**. On a workspace, Claude Code works like a careful senior developer: with your rules, your record and your knowledge. Use the whole flow, or only the skills that you need.

| Chapter | Read it when |
|---|---|
| [1. Start](01-start.md) | you install Nook and make your first workspace |
| [2. Workspaces](02-workspaces.md) | you want two workspaces, a child workspace, or a command that an agent may run |
| [3. A day with Nook](03-day.md) | you start a day, answer a question, or decide at a gate |
| [4. Work](04-work.md) | you take a ticket to a result that you accept |
| [5. The wiki](05-wiki.md) | you keep what you learn, or ask what you know |
| [6. When something blocks](06-blocks.md) | a guard stops a call, or `nook doctor` shows a gap |

## Two promises

| Promise | What you get | Example |
|---|---|---|
| Work | Agents take an item to a result that you accept, with evidence that you can check. | `SHOP-12` goes from a ticket to a branch with tests. You type `/gate accept SHOP-12`. |
| Grow | What you learn and decide goes into one wiki. You and the agents read it. | The lesson of an article becomes a page in `resources/`. |

## Words of this book

| Word | Meaning |
|---|---|
| workspace | a folder with `nook.yml` |
| feature | what Nook does in a workspace: core, engineering, issue-tracker, wiki; on where `nook.yml` has its section |
| owner | you, the person who uses Nook |
| companion | the main Claude Code session on a workspace, with the persona `nook-companion` |
| item | one piece of work with a goal and criteria, such as `SHOP-12` |
| gate | a step that only you take: approve a plan, accept a result |
| guard | a hook that stops a call that breaks a safety rule or takes your move, and names the fix |
| door note | a fact that shows at a move, such as a plan that changed after the approve; the move still runs |

The exact contracts are in [the reference](../reference/). The state of the build is in [the report](../report.md).
