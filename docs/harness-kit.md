# Harness Kit

Status: v0.1 in progress, 2026-10-15; the scaffold of the core pack exists. The full guide is `harness-guide.html` (published at <https://claude.ai/artifact/17Dr7beapRMnecSZJ1QeTp>). This file is the short form.
The old plans and the code sketch are in `~/Workspaces/personal/archive/projects/` (stackspace, harness-code-sketch, ideas-everything).

## 1. In one line

**A base layer for Claude Code that you init into any folder.**
It gives Claude Code your standards: base rules, templates and packs for work, research, learning, knowledge and reports.
Claude Code runs the sessions. The kit holds the goals, the standards, the record and the vault of one person. Open source, MIT.

| Promise | Outcome |
|---|---|
| Work | Agents take an item to a result that you accept, in your way, with evidence that you can check. |
| Learn | You learn any skill or subject against a real standard, or one topic until you can explain it. |
| Grow | What you research, learn and decide goes into one wiki that you and the agents both search. |

## 2. The one idea

**Init a folder to make an environment. Its packs and rules reach every folder inside it.**
A folder with `kit.yml` is an environment. A boundary such as `company/` is a large one; the folders inside it are smaller ones, and a project is only one of them.
- Claude Code reads `CLAUDE.md` and `.claude/rules/` from every folder above a session. Words flow down.
- It reads `.claude/settings.json` only in the start folder. So hooks and permissions stay in the folder where a pack is on.
- The kit has no fixed structure. A folder can turn on many packs. How you split folders is your choice.
- Packs flow down: the packs of a folder are the union of every `kit.yml` above it; a child can add one or turn one off (`packs: { off: [jira] }`).
- State stays at the nearest environment that turns the pack on: one ledger and one wiki for a whole boundary, or a child with its own when you init the pack there again.
- One init for a whole boundary is enough: `company/` with every pack, nothing inside; one ledger, one wiki, one session or many. Do not init packs in a folder that holds two boundaries that must stay apart; that folder needs no init, or words only.
- Hooks follow the packs, not the folder: the kit plugin is on for your user, and each hook finds the nearest `kit.yml` up the tree before it acts.

```
kit init                         # context only: kit.yml, the kit block of CLAUDE.md, .claude/rules/kit/
kit init --pack engineering,wiki # plus the packs: settings keys, folders, state in .kit/
kit init --update                # replace only what the kit owns
kit doctor                       # every layer, every pack, every gap with its fix
```

`kit init` only scaffolds the kit: `kit.yml` with the packs, the kit block of `CLAUDE.md`, `.claude/rules/kit/`, its settings keys, `.kit/`. The `/setup` skill builds the environment: it reads the disk, asks what the disk cannot settle, writes the areas, checks, tracker and shelves into `kit.yml`, makes the folders (`projects/`, `backlog/`, `work/`, `learn/`, `docs/wiki/`, `docs/references/`, `archive/`), and writes the map of the folder in `CLAUDE.md`. `/setup <what changed>` runs again when a repo or a check changes.

The kit owns only what it marks: the block in `CLAUDE.md`, `.claude/rules/kit/`, its keys in settings. Everything else is yours.
To drop a base rule, turn it off in `kit.yml`. Do not write the opposite rule: Claude Code has no sure override between two rules.

## 3. Packs

| Pack | What it gives | Record |
|---|---|---|
| core | the persona, base rules (writing, safety, questions), `kit init`, `kit doctor`, secret guards, `/gate`, `/grill-me`, `/brief`, `/report`, `/retro` | none |
| engineering | the item flow, two gates, 28 skills, 10 agents, the walkthrough page | the ledger in `.kit/` |
| research | `/research`: analysts in parallel, findings, a fact-checker | `findings.md` |
| learn | courses against a standard, topics with `/study`, the daily and weekly loops | plain files in `learn/`, concept pages in the wiki |
| wiki | `docs/wiki/` and `docs/references/`, `docs/wiki/INDEX.md`, `/wiki-add`, `/wiki-ask`, `/wiki-tidy` | the pages |
| visual | write and draw for the reader: the UI kit, page templates, `page`, `diagram`, `deck`, `sketch`; used by every pack | pages next to the work or the record |
| jira | `pull-ticket`, read only | none |

Rules of a pack: its library in `packages/` imports `shared` and `env` only; its plugin in `plugins/` has no code and calls the `kit` binary; its read commands print JSON with `--json`; the exit codes are the same in every tool.

## 4. Engineering: the life of one item

One piece of work is an **item**. Its id is the key of the tracker (`SHOP-12`) or one that the kit makes (`IT-7`). A slice inside an item is `T1`, `T2`.

| Phase | State | Stage skill | Craft skills | Agents | Ends when |
|---|---|---|---|---|---|
| Intake | backlog | `/intake` | pull-ticket | scout | the item is in the backlog |
| Framing | framing | `/spec` | triage, find-repos, write-spec, spec-check | scout | you confirm `spec.md` |
| Planning | planning | `/recipe` | write-plan, challenge, slice-tasks, plan-check, contract-check, adr | skeptic, system-designer, contract-designer, data-modeler | you approve: `/gate approve <id>` |
| Cooking | cooking | `/cook` | tdd, test-design, clean-code, diagnose, verify | backend-builder, frontend-builder, verifier | all slices done and checked |
| Checking | checking | `/quality-check`, `/view` | code-review, verify | reviewer, code-reviewer | you accept: `/gate accept <id>` |
| Close | done | `/close` | adr, wiki-add | | done |

- The skill name `/recipe` pairs with `/cook`. Under it, the document is `plan.md`, the state is `planning`, the craft skills are `write-plan` and `plan-check`.
- Other stage skills, in any phase: `/quick`, `/auto`, `/guesses`, `/handoff`, `/pickup`.
- Moves back: `reject` to cooking, `replan` to planning, `reframe` to framing when the goal changed. Each move back clears the approval.
- Guards: approved documents are frozen (fingerprints); a new test must fail on the base of the branch; the reviewer is not the builder; the scout reads tickets with no write tools.
- Branches and worktrees: `item branch` makes `kit/<id>-<slug>` in each git area and switches the checkout. A second item in the same area gets a worktree in `.kit/worktrees/<id>/<area>/` with its own install; the edit guard keeps its builders there; checks, proof and commits run in the place of the item; the worktree goes at done unless it is dirty. A `WorktreeCreate` hook gives a Claude Code background session the same worktree. In v0.1 one item builds in each area at a time; worktrees come when two items need the same area.
- Evidence grades: run, sourced, judged, owner. At the accept, the weakest shows first.
- The kit never approves or accepts for you, never pushes, never reads secrets, and commits only when you say yes.

Who does the work. The lead, the main session, directs the work. A one-shot job that returns a summary runs as a subagent: a scout, a verifier, a reviewer, a skeptic, a designer, an analyst. It runs in the background where it can, so its context never enters the lead's. A builder is a teammate only when it keeps context worth keeping: an area with two or more slices, or an item of size M or L. A teammate is a separate session that lives for the item and talks with the lead. An area with one slice gets a background subagent with the same brief. A quick item, or an item of size S with one slice, the lead builds itself. Everything else the lead does itself: triage, the spec, the plan, the answers, the moves. Agent teams are on in every environment of the kit; a `name` on an Agent call goes only to such a builder. When teams are off, in a headless run, a builder falls back to a background subagent.

## 5. Research, learn, wiki, visual

- **Research.** Outputs: an answer in chat for a quick question; `findings.md` and `docs/references/` for a research item; a decision record when the question was a choice; wiki pages for what lasts; a page when you ask. A question splits into sub-questions. Analysts answer in parallel with sources and a confidence (high: two independent sources; medium: one; low: an inference). A fact-checker opens each source again. You accept; the lasting part becomes a wiki page.
- **Learn.** The pack teaches any skill or subject, in two kinds. A course takes you to a level against a standard (the map: can-do levels) and a measure (the ruler: the criteria of a test or an exam). A topic is one thing that you understand until you can explain it: `/study <topic>` gives the facts first, then explain, an example, a check, your notes into the wiki. Skills: `/learn-setup <course>`, `/learn-today [course]`, `/learn-practice [course] <task>`, `/learn-progress [course]`, `/study <topic>`. A course keeps `learn/<course>/` in the environment (example `learn/english/`): `roadmap.md`, `mistakes.md`, `scores.md`, `cards/`, `study.md`. A topic goes into the wiki as a concept page plus one line in the study log. Example courses: English as a working language (CEFR is the map, IELTS the ruler); a cloud certification (the exam guide is the map, practice exams the ruler); an instrument (a grade syllabus is both). The loop. Daily, 15 minutes: your own output of the day, the due cards, one drill on a top pattern. Weekly, 45 minutes: one timed task, scored on each criterion of the ruler. Monthly, 30 minutes: a level for each skill of the course, the plan of next month. Each quarter, 3 hours: a full mock or the real test; the next quarter starts from the new level. A course takes captures from your own work when its roadmap turns them on: the English course reads the sentences that you write in chat; a code course reads your commits. Captures are off by default. A score names the criterion of the ruler and quotes the evidence. You judge your level; the scores are a help, not the truth.
- **Real examples over descriptions.** Research and learn show a real example where a description is possible: a product, a page, a passage, a sentence of the owner. An adjective such as "modern" or "premium" means a different thing to each reader; an example shows the exact thing. Research gives each claim of quality with its example. Learn gives the example before the rule, and practice uses the real output of the owner.
- **Grill me.** For a big decision (a product direction, a channel, a business plan) the answer is often in the head of the owner already, out of order. `/grill-me` interviews the owner one question at a time, asks for an example for each adjective, and writes the decision with its reasons and open points into `docs/grill/`.
- **Wiki.** One topic for each page, each claim with a source, plain Markdown with `[[links]]`. Agents open the wiki on a condition: when you ask, or when a line of `INDEX.md` matches the item. The index read is cheap; a page read is not.
- **Visual.** Markdown is the record and what agents read. HTML is what you read: one page that you take in at a glance. The pack makes that page for every other pack, from an item, a prompt, a question or a record: walkthrough (`/view <id or question>`), system design, options, report, lesson, topic, progress, brief, week report, retro, deck, sketch. Drawings are inline SVG from the kit, with file and line on each part; charts come from the record rows; Mermaid for a quick diagram in Markdown; canvas rarely. 12 components in one kit; `kit visual diff` builds the annotated diff from git.
- **Three levels of output.** Chat first: the answer in a few lines. Then the Markdown record, always, in full. A page only when you ask, when a stage calls for it, or when the content has a shape that words hide. For large content the agent shows the summary and asks before it makes a page. A page never drops detail; it layers it.

## 6. Version 0, in steps

Each step starts with your expectations as scenarios in `docs/expect/v0.x.md`: what you type, what you get, what you would reject. The step is done when every scenario passes on a real item.

| Step | Parts | Checks |
|---|---|---|
| v0.1 work | first the scaffold (`kit init`, the templates, `/setup`), tried in your own boundaries; then core, engineering, the walkthrough page, jira | a session shows every layer; a real item goes from intake to close; the gates refuse the model; a test that cannot fail is caught |
| v0.2 grow and learn | wiki; learn as files; `/learn-setup`, `/learn-today`, `/learn-practice`; `/brief`, the first `/retro` | an item cites a wiki page; practice on 5 days; the top patterns show; you compare the scores with a real test once |
| v0.3 answer and report | research, `/report week`, `/learn-progress`, the README, the first public release | a real question ends in a wiki page with sources; the week report needs no edit |

After each step, measure: items on the full path against `/quick`; your minutes at the gates; items sent back and why; the context cost of wiki reads and craft skills.

Later, only when real use asks: a main session that sends stages to other folders; more than one Claude account; a learn database with spaced-review cards; a wiki search tool; a board or gate app; voice input; more courses and packs.

## 7. Repo

```
harness-kit/
├── package.json                 Bun workspaces
├── apps/kit/                    the CLI, the binary kit: kit init, kit doctor, kit ste, kit eng …, kit hook …
├── packages/                    the domain libraries
│   ├── shared/                  the CLI router, exit codes, hook IO
│   ├── env/                     environments, kit.yml, pack manifests
│   ├── core/                    init, doctor, ste, the core hooks
│   └── engineering/             the ledger, the item machine, guards, permissions, the document parsers, git, the engineering hooks
├── plugins/                     one Claude Code plugin each: manifest, skills, agents, hooks.json, templates; no code
├── docs/                        this plan, docs/expect/
├── .claude-plugin/marketplace.json
└── LICENSE                      MIT
```

In the repo: skills, agents, hooks, tools, base rules, templates, the courses in our own words, the UI kit.
Never in the repo: your `CLAUDE.md` and rules, ledgers, findings, mistake logs, wiki pages, goals, company names, paths, prompts.
Dependency rule: `apps/kit` imports the packages; a package imports `shared` and `env` only; a plugin imports nothing and calls the `kit` binary.
Built-ins such as `/code-review` and `/verify` are tools inside a craft skill. The kit keeps its rubric, its evidence grades and its gates as the contract.

## 8. To decide

| Choice | Recommendation |
|---|---|
| the GitHub owner and the repo name | `harness-kit`; the tool stays `kit` |
| the main screen: desktop app or terminal | one of them, so no session is hidden |
| the first course: the standard, the goal, the date, the minutes each day | English toward IELTS General; 9 to 12 months; 45 to 60 minutes each day |
