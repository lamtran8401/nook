# Harness Kit

A base layer for Claude Code that you init into any folder.

Harness Kit gives Claude Code your standards: base rules, templates and packs for work, research, learning, knowledge and reports.
You run `kit init` in a folder. Claude Code stacks the folders, and you add your own context on top.

Status: version 0 plan. No code yet. The plan comes first, and each part arrives when real use asks for it.

## The one idea

**Init a folder to make an environment. Its packs and rules reach every folder inside it.**

- Claude Code reads `CLAUDE.md` and `.claude/rules/` from every folder above a session. Words flow down.
- It reads `.claude/settings.json` only in the start folder. So the kit plugin is on for your user, and each hook finds the nearest `kit.yml` up the tree before it acts.
- The kit has no fixed structure. A boundary such as `company/` can carry the packs for everything inside it, and a child can add its own or turn one off.

```
kit init                          # context only
kit init --pack engineering,wiki  # plus the packs
kit init --update                 # replace only what the kit owns
kit doctor                        # every layer, every pack, every gap with its fix
```

`kit init` scaffolds the kit only. The `/setup` skill, in Claude Code, builds the environment: it reads the disk, asks what the disk cannot settle, and writes the areas, the folders and the map of the folder.

## Packs

| Pack | What it gives |
|---|---|
| core | the persona, base rules, `kit init`, `kit doctor`, `/brief`, `/report`, `/retro` |
| engineering | the item flow from intake to your accept, two gates, 28 skills, 10 agents |
| research | `/research`: analysts in parallel, findings with sources, a fact-checker |
| learn | a course against a standard (English to IELTS 7 first), and `/study <topic>` |
| wiki | one knowledge base for you and the agents: `/wiki-add`, `/wiki-ask`, `/wiki-tidy` |
| visual | pages that explain, for every pack: the UI kit, diagrams, decks |
| jira | pull a ticket, read only |

## Read the plan

- [docs/harness-kit.md](docs/harness-kit.md): the short form.
- [docs/harness-guide.html](docs/harness-guide.html): the full guide, 15 chapters with diagrams. Open it in a browser.
- [docs/expect/](docs/expect/): what each step must do before it is done.

## Licence

MIT. See [LICENSE](LICENSE).
