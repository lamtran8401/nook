# Nook

Your standards for Claude Code, in any folder.

> In short: run `nook init` in a folder, and that folder becomes a **desk**. Claude Code then works there by your rules: one flow for each piece of work, gates that only you take, guards that keep secrets and trackers safe, a wiki, and courses. Every folder inside the desk gets the same rules.

## Why Nook

Claude Code is strong, but it starts each session with no memory of your way of work. Nook writes that way down once and makes Claude Code keep it:

| Without Nook | With Nook |
|---|---|
| You repeat your rules in each session. | The rules of the desk load in each session, in each folder below it. |
| The agent decides when the work is done. | A work item stops at two gates: you approve the plan, and you accept the result. |
| The agent can read a `.env` file or write to a ticket. | Hooks block secrets, forced pushes, and every write to Jira or GitHub issues. |
| What the agent learns is lost with the session. | The lasting facts go into the wiki of the desk, with their sources. |

## A day with Nook

One piece of work is an **item**. It moves through seven states, and you type one command for each stage:

```
backlog ──/spec──▶ framing ──▶ planning ──★ approve──▶ ready ──/cook──▶ cooking ──▶ review ──★ accept──▶ done
```

★ marks a gate. Only you take it, with `/gate approve SHOP-12` or `/gate accept SHOP-12`. Between the gates, the companion runs the agents: a scout reads the ticket, a skeptic attacks the plan, one builder for each repo writes the code test first, and a reviewer checks each acceptance criterion with evidence.

A small fix takes the short path: `/quick SHOP-30 the export uses the wrong date`. Type `nook eng next` at any time: it names the next step of each item, your steps first.

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
claude plugin install nook@nook        # the core: always
claude plugin install nk-eng@nook      # then one plugin for each pack that you use
claude plugin install nk-wiki@nook
claude plugin install nk-learn@nook
claude plugin install nk-issues@nook
```

`nook --help` lists the commands when the install works.

## Make a desk

In the folder that you want as a desk:

```sh
nook init --pack engineering,wiki,learn
```

Then start Claude Code in that folder and type `/setup`. The skill reads the disk (the git repos, the scripts, the CI files), asks you only what the disk cannot answer, and writes the setup of each pack. At the end, `nook doctor` must show no gap.

`nook init` writes only the lines that it marks. Each other line of your `CLAUDE.md` and your settings stays yours.

## Desks nest

A folder with `nook.yml` is a desk. Its packs and rules reach every folder inside it.

```
company/            a top desk: engineering, issue-tracker
├── shop/           a child desk: adds the wiki
└── billing/        no nook.yml: gets the packs of company/
personal/           a second top desk: engineering, wiki, learn
```

- Claude Code reads `CLAUDE.md` and `.claude/rules/` from each folder above a session, so the rules flow down.
- The plugins are on for your user. Each hook finds the nearest `nook.yml` above the session before it acts.
- A child desk adds a pack or turns one off. Two desks side by side share nothing.

## Packs

| Pack | Plugin | What it gives |
|---|---|---|
| core | `nook` | the base rules, the companion persona, the secret guards, the writing check, `/setup`, `/gate`, `/brief`, `/retro`, `/grill-me`, and the web app |
| engineering | `nk-eng` | the item flow from a ticket to your accept: a ledger, two gates, the full, quick and yolo paths, 29 skills and 10 agents |
| issue-tracker | `nk-issues` | tickets of Jira (through `twg`) and GitHub (through `gh`) into `backlog/`, with a map of the fields of each team; read only |
| wiki | `nk-wiki` | one wiki for you and the agents, with shelves, indexes and a link check: `/wiki-add`, `/wiki-ask`, `/wiki-merge`, `/wiki-tidy` |
| learn | `nk-learn` | a course against a real standard, such as IELTS: a roadmap, flash cards, a log of your mistakes, scores with evidence, and `/study` for one topic |

`nook packs` shows the packs of the folder that you are in.

## What keeps the work safe

The guards are hooks and permission rules. A guard that cannot decide blocks the call and says why.

| Guard | It blocks |
|---|---|
| secrets | each read of `.env` files, `~/.ssh`, `~/.aws`, and the `secrets` list of `nook.yml` |
| state | each edit of the ledger and of `.claude/settings*.json`; only the `nook` tool writes them |
| gates | an agent that runs approve, accept or a mode change; only you take a gate |
| git | a forced push, `git reset --hard`, `git clean`; a commit or a push asks you first |
| scope | an edit of a repo of the flow while no slice of that repo runs, and a change to the spec or the plan after your approve |
| trackers | each write of `twg` and `gh` to a ticket: a comment, an update, a transition, a new issue |

## The web app

`nook web` shows the desk in the browser, on `127.0.0.1` only: the board of the items, each item with its spec, plan, slices and timeline, the wiki, the courses, and a search box over all of them. The page updates live when a file changes.

Any browser on your machine can read the pages. A move, such as an approve, needs a browser that you paired with `nook web pair`, so an agent can never take your gate through the web app. Only you start the app, from your own terminal.

## State of the build

Nook is in daily use on real desks. The engineering pack has taken items end to end; the wiki and learn are built and wait for more use.

| Step | State |
|---|---|
| v0.1 the work flow, v0.2 the wiki and learn | done |
| v0.3 issue-tracker, area installs, `nook web` with search | in progress: export, `/view` and the docs are left |
| research: analysts in parallel, each finding with a source, a fact-checker | planned |
| visual: diagrams, decks and sketches for every pack | planned |

[The build report](docs/report.md) has the numbers: the commands, the skills, the tests, and the limits that are known.

## Read more

| Read | When |
|---|---|
| [The guide book](docs/guide/README.md) | you want to use Nook: start, desks, a day, work, the wiki, learn |
| [The reference](docs/reference/) | you need the exact contract of a pack: [core](docs/reference/core.md), [engineering](docs/reference/engineering.md), [issue-tracker](docs/reference/issues.md), [wiki](docs/reference/wiki.md), [learn](docs/reference/learn.md) |
| [The build report](docs/report.md) | you want the parts, the numbers, the limits and the next steps |
| [CLAUDE.md](CLAUDE.md) | you change Nook itself: the map of the repo, its checks and its rules |

## Work on Nook

Nook is a Bun workspace in TypeScript: one binary in `apps/nook`, one package for each pack in `packages/`, one plugin with no code for each pack in `plugins/`, and the web app in `apps/web`.

```sh
bun run check      # the type check and every test
bun run e2e        # builds the web app under Node and checks its pages in headless Chrome
bun run demo <dir> # makes a desk with sample items, to look at the web app
```

## Licence

MIT. See [LICENSE](LICENSE).
