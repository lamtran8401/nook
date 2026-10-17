# Nook

A base layer for Claude Code that you init into any folder.

Nook gives Claude Code your standards: base rules, a persona, guards, and packs for work, knowledge and learning. You run `nook init` in a folder, and that folder becomes a **desk**. Its packs and rules reach every folder inside it.

## Install

You need [Bun](https://bun.sh) and Claude Code.

```
git clone <this repo> nook && cd nook && bun install
ln -s "$PWD/apps/nook/bin/nook" ~/.local/bin/nook     # the hooks and the agents run nook
ln -s "$PWD/apps/nook/bin/nook" ~/.local/bin/nk       # a short form for you; an agent never runs it
claude plugin marketplace add "$PWD"
claude plugin install nook@nook                       # the core: always
claude plugin install nk-eng@nook                     # one plugin for each pack that you use
claude plugin install nk-wiki@nook
claude plugin install nk-learn@nook
```

Then, in each folder that you want as a desk:

```
nook init --pack engineering,wiki,learn
```

In Claude Code, type `/setup` in that folder. Then `nook doctor` must show no gap.

## The one idea

**A folder with `nook.yml` is a desk. Its packs and rules reach every folder inside it.**

- Claude Code reads `CLAUDE.md` and `.claude/rules/` from each folder above a session, so the words flow down.
- The plugins are on for your user. Each hook finds the nearest `nook.yml` above the session before it acts.
- Desks nest. A top desk such as `company/` gives its packs to each folder inside it. A child desk adds a pack or turns one off.

## Packs

| Pack | Plugin | What it gives |
|---|---|---|
| core | `nook` | the persona, the base rules, the guards, the writing check, `/setup`, `/checkup`, `/gate`, `/brief`, `/retro`, `/grill-me` |
| engineering | `nk-eng` | the item flow from a ticket to your accept: a ledger, two gates, 29 skills, 10 agents |
| wiki | `nk-wiki` | one wiki for you and the agents: `/wiki-add`, `/wiki-ask`, `/wiki-merge`, `/wiki-tidy`, a librarian |
| learn | `nk-learn` | a course against a real standard, and one topic with `/study`: 6 skills, a coach |

## Read more

| Read | When |
|---|---|
| [The guide book](docs/guide/README.md) | you want to use Nook: install, a day, work, the wiki, learn, blocks |
| [The reference](docs/reference/) | you need the exact contract of a pack: [core](docs/reference/core.md), [engineering](docs/reference/engineering.md), [wiki](docs/reference/wiki.md), [learn](docs/reference/learn.md) |
| [The build report](docs/report.md) | you want the state of the build: the parts, the numbers, the limits, the next steps |
| [The expectation](docs/expect/) | you build the next step |

## Licence

MIT. See [LICENSE](LICENSE).
