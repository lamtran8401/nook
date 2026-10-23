# Nook

A harness kit for a developer in Claude Code.

> In short: run `nook init` in a folder, and that folder becomes a **workspace**. Claude Code then works there like a careful senior developer: by your rules, with guards that keep secrets and your moves safe, a flow from a ticket to your accept, and a wiki. Use the whole flow, or only the skills that you need. Every folder inside the workspace gets the same rules.

## Why Nook

Claude Code is strong, but it starts each session with no memory of your way of work. Nook writes that way down once and makes Claude Code keep it:

| Without Nook | With Nook |
|---|---|
| You repeat your rules in each session. | The rules of the workspace load in each session, in each folder below it. |
| The agent decides when the work is done. | A work item stops at two gates: you approve the plan, and you accept the result, with its evidence beside the button. |
| The agent can read a `.env` file or write to a ticket. | Hooks block secrets, forced pushes, and every write to Jira or GitHub issues. |
| A full run starts a dozen agents and drains your credits. | A lean budget starts two agents at most for an item. |
| What the agent learns is lost with the session. | The lasting facts go into the wiki of the workspace, with their sources. |

## A day with Nook

One piece of work is an **item**. It moves through seven states, and you type one command for each stage:

```
backlog ──/specify──▶ framing ──▶ planning ──★ approve──▶ ready ──/cook──▶ cooking ──▶ review ──★ accept──▶ done
```

★ marks a gate. Only you take it, with `/gate approve SHOP-12` or `/gate accept SHOP-12`. Between the gates, the companion does the work: it writes the spec and the plan, builds each slice test first, and a fresh reviewer checks each acceptance criterion with evidence.

A small fix takes the short path: `/quick SHOP-30 the export uses the wrong date`. Out of the flow, each skill also works alone, such as `/debug`, `/review`, `/tdd` or `/pr`. Type `nook eng next` at any time: it names the next step of each item, your steps first.

## Install

You need:

- macOS. Nook is built and used on macOS; other systems are not tested.
- [Bun](https://bun.sh) 1.4 or later.
- Claude Code, in the terminal or the desktop app.
- Node 24 or later, only for the web app.

Do these steps once:

```sh
git clone https://github.com/lamtran8401/nook.git && cd nook && bun install
ln -s "$PWD/apps/nook/bin/nook" ~/.local/bin/nook
claude plugin marketplace add "$PWD"
claude plugin install nook@nook
```

`nook --help` lists the commands when the install works.

## Make a workspace

In the folder that you want as a workspace:

```sh
nook init --with engineering,wiki
```

Then start Claude Code in that folder and type `/setup`. The skill reads the disk (the git repos, the scripts, the CI files), asks you only what the disk cannot answer, and writes the section of each feature. At the end, `nook doctor` must show no gap.

`nook init` writes only the lines that it marks. Each other line of your `CLAUDE.md` and your settings stays yours.

## One file for the harness

`nook.yml` holds every setting of a workspace:

```yaml
secrets: [config/prod.yml]          # files that no agent reads
budget: lean                        # lean or deep: how many agents a skill starts
guards:
  commands:
    allow: [gh pr create]           # an agent runs it with no question
    ask: [git push]
    deny: [rm -rf]

engineering: { ... }                # a feature is on where its section is
wiki: {}
```

`nook init --update` writes the command lists into the permissions of Claude Code. The Harness page of the web app shows all of it.

## Workspaces nest

A folder with `nook.yml` is a workspace. Its features and rules reach every folder inside it.

```
company/            a top workspace: engineering, issue-tracker
├── shop/           a child workspace: its own engineering section, so its own ledger
└── billing/        no nook.yml: gets the features of company/
personal/           a second top workspace: engineering, wiki
```

- Claude Code reads `CLAUDE.md` and `.claude/rules/` from each folder above a session, so the rules flow down.
- The plugin is on for your user. Each hook finds the nearest `nook.yml` above the session before it acts.
- A child workspace with its own section becomes the home of that feature. Two workspaces side by side share nothing.

## Features

| Feature | Turned on by | What it gives |
|---|---|---|
| core | always on | the base rules, the companion persona, the secret guards, the command lists, the agent budget, the writing check, `/setup`, `/gate`, `/daily-brief`, `/retro`, `/grill-me`, and the web app |
| engineering | `engineering:` | the item flow from a ticket to your accept: a ledger, two gates, the full, quick and yolo paths, ids by kind such as `WI-007` and `BUG-003`, the craft skills and 10 agents |
| issue-tracker | `issue-tracker:` | tickets of Jira (through `twg`) and GitHub (through `gh`) into `backlog/`, with a map of the fields of each team; read only |
| wiki | `wiki:` | one wiki for you and the agents, with shelves, indexes and a link check: `/wiki-add`, `/wiki-ask`, `/wiki-merge`, `/wiki-tidy` |

One plugin holds every skill, agent and hook. `nook features` shows the features of the folder that you are in.

## What keeps the work safe

A guard blocks only for safety and for your moves. The rest shows at the door of a move, and the move still runs. A guard that cannot decide blocks the call and says why.

| Guard | It blocks |
|---|---|
| secrets | each read of `.env` files, `~/.ssh`, `~/.aws`, and the `secrets` list of `nook.yml` |
| state | each edit of the ledger and of `.claude/settings*.json`; only the `nook` tool writes them |
| gates | an agent that runs approve, accept or a mode change; only you take a gate |
| git | a forced push, `git reset --hard`, `git clean`; a commit or a push asks you first |
| roles | a reader agent that writes, and a builder that edits outside the area of its slice |
| trackers | each write of `twg` and `gh` to a ticket: a comment, an update, a transition, a new issue |

You can still fix a thing yourself in review. The edit passes, the ledger logs it, and your accept shows each file that changed outside a slice.

## The web app

`nook web` shows the workspace in the browser, on `127.0.0.1` only: your inbox with the evidence of each gate, the board with saved views, each item with its spec, plan, slices, agents and timeline, the wiki, the Harness page, and a search box. The page updates live when a file changes.

Any browser on your machine can read the pages. A move, such as an approve, needs a browser that you paired with `nook web pair`, so an agent can never take your gate through the web app. Only you start the app, from your own terminal.

## State of the build

Nook is in daily use on real workspaces. Engineering has taken items end to end; the wiki and the issue-tracker are built and wait for more use.

| Step | State |
|---|---|
| v0.1 the work flow, v0.2 the wiki, v0.3 issue-tracker and `nook web` | done |
| the reset: a harness kit with one plugin, features by section, guards at the door, the agent budget and the v3 look | done |
| skill evals, a lease for the lead of an item, `nook web` on a private network | planned |

[The build report](docs/report.md) has the numbers: the commands, the skills, the tests, and the limits that are known.

## Read more

| Read | When |
|---|---|
| [The guide book](docs/guide/README.md) | you want to use Nook: start, workspaces, a day, work, the wiki, blocks |
| [The reference](docs/reference/) | you need the exact contract of a feature: [core](docs/reference/core.md), [engineering](docs/reference/engineering.md), [issue-tracker](docs/reference/issues.md), [wiki](docs/reference/wiki.md) |
| [The build report](docs/report.md) | you want the parts, the numbers, the limits and the next steps |
| [CLAUDE.md](CLAUDE.md) | you change Nook itself: the map of the repo, its checks and its rules |

## Work on Nook

Nook is a Bun workspace in TypeScript: one binary in `apps/nook`, one package for each feature in `packages/`, the one plugin with no code in `plugin/`, and the web app in `apps/web`.

```sh
bun run check      # the type check and every test
bun run e2e        # builds the web app under Node and checks its pages in headless Chrome
bun run demo <dir> # makes a workspace with sample items, to look at the web app
```

## Licence

MIT. See [LICENSE](LICENSE).
