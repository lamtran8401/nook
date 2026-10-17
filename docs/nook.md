# Nook

> In short: Nook is a base layer for Claude Code that you init into any folder. It gives Claude Code your standards: rules, a persona, guards and packs for work, knowledge and learning.

Claude Code runs the sessions. Nook holds the standards, the record and the knowledge of one person. Open source, MIT.

| Promise | Outcome |
|---|---|
| Work | Agents take an item to a result that you accept, with evidence that you can check. |
| Learn | You learn a subject against a real standard, or one topic until you can explain it. |
| Grow | What you learn and decide goes into one wiki. You and the agents read it. |

## 1. The desk

**A folder with `nook.yml` is a desk. Its packs and rules reach every folder inside it.**

- Desks nest. `company/` is a top desk; `company/shop/` is a child desk inside it.
- Claude Code reads `CLAUDE.md` and `.claude/rules/` from each folder above a session. So the words flow down.
- Claude Code reads `.claude/settings.json` only in the start folder. So the Nook plugins are on for your user, and each hook finds the nearest `nook.yml` above it.
- Packs flow down. The packs of a folder are the union of each `nook.yml` above it. A child desk adds a pack, or turns one off with `packs: { off: [wiki] }`.
- The state of a pack stays at the nearest desk that turns the pack on. One init of `company/` gives one ledger and one wiki for the whole tree.
- A folder that holds two desks that must stay apart, such as `company/` and `personal/`, gets no packs.

## 2. Init and setup

```
nook init                           # nook.yml, the Nook block, the base rules, the style, the settings keys, .nook/
nook init --pack engineering,wiki   # the same, plus each pack: its rules, its settings keys, its folders, its state
nook init --update                  # write again only what Nook owns
nook doctor                         # each desk above, the packs of each one, every gap with its fix
```

`nook init` writes only what it marks:

| Part | Where |
|---|---|
| the packs | `nook.yml`, made once; a later init only adds packs |
| the Nook block | `CLAUDE.md`, between `<!-- nook:begin -->` and `<!-- nook:end -->` |
| the base rules | `.claude/rules/nook/`, one file for each rule of a pack that is on |
| the persona | `.claude/output-styles/nook-companion.md` |
| the settings keys | `.claude/settings.json`: permissions, the output style, agent teams |
| the state | `.nook/`, and the folders of each pack, such as `work/`, `backlog/` and `docs/adr/` |
| the list of desks | `~/.config/nook/desks`, which `nook brief` reads |

Each other line is yours. To drop a base rule, write `rules: { off: [writing] }` in `nook.yml`. Do not write the opposite rule: Claude Code has no sure order between two rules.

The `/setup` skill does the rest in Claude Code. It reads the disk, asks only what the disk cannot settle, and writes the section of each pack into `nook.yml`. For engineering, that is the areas, their checks and their test command. It also writes the map of the folder into `CLAUDE.md`, outside the Nook block. Run `/setup <what changed>` after a new repo or a changed check.

## 3. Packs

| Pack | What it gives | Record |
|---|---|---|
| core | the persona, the rules `writing`, `safety` and `questions`, the secret guards, the writing check, `/setup`, `/checkup`, `/gate`, `/brief`, `/retro`, `/grill-me` | `docs/retro/`, `docs/grill/` |
| engineering | the item flow from intake to your accept, two gates, 29 skills, 10 agents, the item page | the ledger `.nook/engineering.db`, `work/`, `backlog/`, `docs/adr/` |
| wiki | the shelves of `docs/wiki/`, an `INDEX.md` on each shelf, `docs/references/`, `/wiki-add`, `/wiki-ask`, `/wiki-merge`, `/wiki-tidy`, the librarian agent | the pages |
| learn | courses against a standard, one topic with `/study`, the cards, the mistake log, the scores, the coach agent | `learn/<course>/` |

`nook packs` lists the packs on here and where each keeps its record. The commands of a pack run under its name: `nook eng …`, `nook wiki …`, `nook learn …`.

- **Engineering.** One piece of work is an item, such as `SHOP-12` or `IT-001`. It moves through `backlog → framing → planning → ready → cooking → review → done`. Only you approve the plan and accept the result, with `/gate`. The contract is in `docs/engineering.md`.
- **Wiki.** One topic for each page, each claim with a source, plain Markdown with `[[links]]`. An agent reads the index first and opens a page only when its line matches the task. The contract is in `docs/wiki.md`.
- **Learn.** A course takes you to a level against a map (the can-do levels) and a ruler (the criteria of a test). Example: English, with CEFR as the map and IELTS as the ruler. The skills are `/learn-setup`, `/learn-today`, `/learn-practice` and `/study`. A course keeps `roadmap.md`, `mistakes.md`, `scores.md`, `cards/` and `study.md` in `learn/<course>/`. The roadmap sets the minutes of each day. A card comes back after 2, 4, 8 and 16 days. A score names the criterion and quotes your words; you judge the level.

## 4. Three levels of output

1. Chat first: the answer in a few lines, and what waits for you.
2. Then the Markdown record, always, in full. Agents read it.
3. A page only when you ask, when a stage calls for it, or when the content has a shape that words hide. `/view` and `nook eng item page` build the page of an item from the Bench UI kit in `plugins/core/ui/bench/`.

Real examples come before descriptions. An adjective such as "modern" means a different thing to each reader; an example shows the exact thing.

## 5. Repo

```
nook/
├── apps/nook/            the binary nook: it joins the commands of each package
├── packages/
│   ├── shared/           the CLI router, the exit codes, the hook input and output, the names of the tool
│   ├── desk/             desks, nook.yml, the pack manifests, the plugin folders, the UI kit
│   ├── core/             init, doctor, ste, brief, retro, the core hooks
│   ├── engineering/      the ledger, the item machine, the guards, the documents, git, the engineering hooks
│   ├── wiki/             the shelves, their indexes, the link check
│   └── learn/            the courses: roadmap, cards, mistakes, scores, the study log
├── plugins/<pack>/       one Claude Code plugin each: pack.json, skills, agents, hooks, templates; no code
├── docs/                 this file, the contracts, docs/expect/
└── .claude-plugin/       the marketplace
```

The dependency rule: `apps/nook` imports the packages. A package imports `@nook/shared/*` and `@nook/desk/*` only. A plugin holds no code: its hooks call `bin/nook`, which runs the binary.

The repo holds the tool: skills, agents, hooks, rules, templates, the UI kit. It never holds what is yours: your `CLAUDE.md`, a ledger, a wiki page, a mistake log, a company name or a path.

## 6. Next

Each step starts with its expectations in `docs/expect/<step>.md`, before code. The step is done when each scenario passes on a real desk. The current file is `docs/expect/desk-cleanup.md`.

| Step | What | State |
|---|---|---|
| v0.3 the viewer | `nook view`: one Next.js server on `127.0.0.1` for one desk. It imports a read module of each pack. You approve, accept and answer in the UI. | planned |
| research | `/research`: analysts in parallel, each finding with a source, a fact-checker | planned |
| visual | the page of every pack: diagrams, decks, sketches | planned |
| jira | pull a ticket, read only, when a desk has a real tracker | planned |
| `/learn-progress` | a level for each skill of a course, the plan of next month | planned |

After each step, measure: the items on the full path against `/quick`, your minutes at the gates, the items sent back and why, the context cost of the wiki reads.

Open choices:

| Choice | Recommendation |
|---|---|
| the main screen: the desktop app or the terminal | one of them, so no session is hidden |
| the first pages of the viewer, and how it ships | decide in the plan of v0.3 |
