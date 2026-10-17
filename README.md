# Nook

A base layer for Claude Code that you init into any folder.

Nook gives Claude Code your standards: base rules, templates and packs for work, research, learning, knowledge and reports.
You run `nook init` in a folder. Claude Code stacks the folders, and you add your own context on top.

Status: v0.1 in progress. The core and the engineering pack work: `nook init`, `nook doctor`, `nook ste`, `nook eng`, the base rules, the persona, the guards, the writing check, `/setup`, and the item flow from `/intake` to the owner's accept. The other packs come in v0.2 and v0.3. Each part arrives when real use asks for it.

## Install

You need [Bun](https://bun.sh) and Claude Code.

```
git clone <this repo> nook && cd nook && bun install
ln -s "$PWD/apps/nook/bin/nook" ~/.local/bin/nook        # nook on your PATH; the hooks need it
claude plugin marketplace add "$PWD"
claude plugin install nook@nook                  # the core: always
claude plugin install nook-engineering@nook      # one plugin for each pack that you use
```

Then, in each folder that you want as an environment:

```
nook init --pack engineering    # nook.yml, the rules, the settings, and the folders of each pack
```

In Claude Code, run `/setup` in that folder. It writes the section of each pack in `nook.yml` (for engineering: the areas, their checks and their test command). Run it again when you turn a pack on. `nook doctor` lists every gap that is left, the gaps of each pack and a plugin that is off included.

## The one idea

**Init a folder to make an environment. Its packs and rules reach every folder inside it.**

- Claude Code reads `CLAUDE.md` and `.claude/rules/` from every folder above a session. Words flow down.
- It reads `.claude/settings.json` only in the start folder. So the nook plugin is on for your user, and each hook finds the nearest `nook.yml` up the tree before it acts.
- Nook has no fixed structure. A boundary such as `company/` can carry the packs for everything inside it, and a child can add its own or turn one off.

```
nook init                          # context only
nook init --pack engineering,wiki  # plus the packs
nook init --update                 # replace only what Nook owns
nook doctor                        # every layer, every pack, every gap with its fix
```

`nook init` scaffolds Nook only. The `/setup` skill, in Claude Code, builds the environment: it reads the disk, asks what the disk cannot settle, and writes the areas, the folders and the map of the folder.

## Packs

| Pack | What it gives |
|---|---|
| core | the persona, the base rules, the guards, `nook init`, `nook doctor`, `/setup` |
| engineering | the item flow from intake to your accept, two gates, 28 skills, 10 agents |
| research | `/research`: analysts in parallel, findings with sources, a fact-checker |
| learn | a course in any subject against a standard, and `/study <topic>` for one topic |
| wiki | one knowledge base for you and the agents: `/wiki-add`, `/wiki-ask`, `/wiki-tidy` |
| visual | pages that explain, for every pack: the UI kit, diagrams, decks |
| jira | pull a ticket, read only |

## Read the plan

- [docs/nook.md](docs/nook.md): the short form.
- [docs/nook-guide.html](docs/nook-guide.html): the full guide, 15 chapters with diagrams. Open it in a browser.
- [docs/expect/](docs/expect/): what each step must do before it is done.

## Licence

MIT. See [LICENSE](LICENSE).
