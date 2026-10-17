# Nook

A base layer for Claude Code that you init into any folder.

Nook gives Claude Code your standards: the base rules, a persona, guards, and packs for engineering, knowledge and learning.
You run `nook init` in a folder. That folder becomes a **desk**. Its packs and rules reach every folder inside it.

## Install

You need [Bun](https://bun.sh) and Claude Code.

```
git clone <this repo> nook && cd nook && bun install
ln -s "$PWD/apps/nook/bin/nook" ~/.local/bin/nook        # the hooks and the agents run `nook`
ln -s "$PWD/apps/nook/bin/nook" ~/.local/bin/nk          # a short form for you; an agent never runs it
claude plugin marketplace add "$PWD"
claude plugin install nook@nook                  # the core: always
claude plugin install nk-eng@nook      # one plugin for each pack that you use
claude plugin install nk-wiki@nook
claude plugin install nk-learn@nook
```

Then, in each folder that you want as a desk:

```
nook init --pack engineering,wiki    # nook.yml, the Nook block, the rules, the settings keys, .nook/
```

In Claude Code, type `/setup` in that folder. It reads the disk, asks what the disk cannot settle, and writes the section of each pack into `nook.yml`. For engineering, the section holds the areas, their checks and their test command. Run `/setup` again when you turn a pack on. `nook doctor` lists each gap that is left, with its fix.

## The one idea

**A folder with `nook.yml` is a desk. Its packs and rules reach every folder inside it.**

- Claude Code reads `CLAUDE.md` and `.claude/rules/` from each folder above a session. The words flow down.
- Claude Code reads `.claude/settings.json` only in the start folder. So the plugins are on for your user, and each hook finds the nearest `nook.yml` above the session before it acts.
- Desks nest. A top desk such as `company/` gives its packs to each folder inside it. A child desk such as `company/shop/` adds a pack or turns one off.
- The record of a pack stays at the nearest desk that turns the pack on: one ledger and one wiki for `company/`, or a child desk with its own.

```
nook init                          # words only: nook.yml, the Nook block of CLAUDE.md, .claude/rules/nook/
nook init --pack engineering,wiki  # plus the packs: their settings keys, folders and state
nook init --update                 # write again only what Nook owns
nook doctor                        # each desk above, each pack, each gap with its fix
nook packs                         # the packs on here and where each keeps its record
```

Nook owns only what it marks: the Nook block of `CLAUDE.md`, `.claude/rules/nook/`, `.claude/output-styles/nook-companion.md`, its keys in `.claude/settings.json`, and `.nook/`. Every other line is yours.

## Packs

| Pack | Plugin | What it gives |
|---|---|---|
| core | `nook` | the persona, the base rules, the guards, the writing check, `/setup`, `/checkup`, `/gate`, `/brief`, `/retro`, `/grill-me` |
| engineering | `nk-eng` | the item flow from intake to your accept: the ledger, two gates, 29 skills, 10 agents |
| wiki | `nk-wiki` | one wiki for you and the agents: `/wiki-add`, `/wiki-ask`, `/wiki-merge`, `/wiki-tidy`, a librarian agent |
| learn | `nk-learn` | a course against a standard, and one topic with `/study`: 6 skills, a coach agent |

The commands of a pack run under the tool: `nook eng …`, `nook wiki …`, `nook learn …`. Type `nook --help` for the full list.

## Next

| Step | What it gives |
|---|---|
| v0.3 | the viewer `nook view`: one local web app for the work, the wiki and the courses of a desk |
| research | `/research`: analysts in parallel, findings with sources, a fact-checker |
| visual | pages, diagrams and decks for each pack |
| jira | pull a ticket, read only |

Each step arrives when real use asks for it.

## Read more

- [docs/nook.md](docs/nook.md): the plan in short form.
- [docs/engineering.md](docs/engineering.md): the contract of the engineering pack.
- [docs/wiki.md](docs/wiki.md): the wiki pack.
- [docs/expect/](docs/expect/): what each step must do before it is done.

## Licence

MIT. See [LICENSE](LICENSE).
