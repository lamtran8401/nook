# Harness Kit

Status: version 0 plan, 2026-10-15. The full guide is `harness-guide.html` (published at <https://claude.ai/artifact/17Dr7beapRMnecSZJ1QeTp>). This file is the short form.
The old plans and the code sketch are in `~/Workspaces/personal/archive/spaces/` (stackspace, harness-code-sketch, ideas-everything).

## 1. In one line

**A base layer for Claude Code that you init into any folder.**
It gives Claude Code your standards: base rules, templates and packs for work, research, learning, knowledge and reports.
Claude Code runs the sessions. The kit holds the goals, the standards, the record and the vault of one person. Open source, MIT.

| Promise | Outcome |
|---|---|
| Work | Agents take an item to a result that you accept, in your way, with evidence that you can check. |
| Learn | You practice a skill each day with your own text, against a real standard. |
| Grow | What you research, learn and decide goes into one wiki that you and the agents both search. |

## 2. The one idea

**Init a folder to make an environment. Its packs and rules reach every folder inside it.**
A folder with `kit.yml` is an environment. A boundary such as `company/` is a large one; the folders inside it are smaller ones, and a space is only one of them.
- Claude Code reads `CLAUDE.md` and `.claude/rules/` from every folder above a session. Words flow down.
- It reads `.claude/settings.json` only in the start folder. So hooks and permissions stay in the folder where a pack is on.
- The kit has no fixed structure. A folder can turn on many packs. How you split folders is your choice.
- Packs flow down: the packs of a folder are the union of every `kit.yml` above it; a child can add one or turn one off (`packs: { off: [jira] }`).
- State stays at the nearest environment that turns the pack on: one ledger and one wiki for a whole boundary, or a child with its own when you init the pack there again.
- One init for a whole boundary is enough: `company/` with every pack, nothing inside; one ledger, one wiki, one session or many. Do not init packs above the boundaries, or company and personal data mix.
- Hooks follow the packs, not the folder: the kit plugin is on for your user, and each hook finds the nearest `kit.yml` up the tree before it acts.

```
kit init                         # context only: kit.yml, the kit block of CLAUDE.md, .claude/rules/kit/
kit init --pack engineering,wiki # plus the packs: settings keys, folders, state in .kit/
kit init --update                # replace only what the kit owns
kit doctor                       # every layer, every pack, every gap with its fix
```

The kit owns only what it marks: the block in `CLAUDE.md`, `.claude/rules/kit/`, its keys in settings. Everything else is yours.
To drop a base rule, turn it off in `kit.yml`. Do not write the opposite rule: Claude Code has no sure override between two rules.

## 3. Packs

| Pack | What it gives | Record |
|---|---|---|
| core | the persona, base rules (writing, safety, questions), `kit init`, `kit doctor`, secret guards, `/brief`, `/report`, `/retro` | none |
| engineering | the item flow, two gates, 28 skills, 10 agents, the walkthrough page | the ledger in `.kit/` |
| research | `/research`: analysts in parallel, findings, a fact-checker | `findings.md` |
| learn | the English course (CEFR as the map, IELTS as the ruler), daily and weekly practice | plain files |
| wiki | `wiki/` and `references/`, `INDEX.md`, `/wiki-add`, `/wiki-ask`, `/wiki-tidy` | the pages |
| visual | write and draw for the reader: the UI kit, page templates, `page`, `diagram`, `deck`, `sketch`; used by every pack | pages next to the work or the record |
| jira | `pull-ticket`, read only | none |

Rules of a pack: it imports `packages/shared` only, never another pack; its read commands print JSON with `--json`; the exit codes are the same in every tool.

## 4. Engineering: the life of one item

One piece of work is an **item**. Its id is the key of the tracker (`BKM-12`) or one that the kit makes (`IT-7`). A slice inside an item is `T1`, `T2`.

| Phase | State | Stage skill | Craft skills | Agents | Ends when |
|---|---|---|---|---|---|
| Intake | backlog | `/intake` | pull-ticket | scout | the item is in the backlog |
| Framing | framing | `/spec` | triage, find-repos, write-spec, spec-check | scout | you confirm `spec.md` |
| Planning | planning | `/recipe` | write-plan, challenge, slice-tasks, plan-check, contract-check, adr | skeptic, system-designer, contract-designer, data-modeler | you approve: `kit eng item approve <id>` |
| Cooking | cooking | `/cook` | tdd, test-design, clean-code, diagnose, verify | backend-builder, frontend-builder, verifier | all slices done and checked |
| Checking | checking | `/check`, `/walkthrough` | code-review, verify | reviewer, code-reviewer | you accept: `kit eng item accept <id>` |
| Close | done | `/close` | adr, wiki-add | | done |

- The skill name `/recipe` pairs with `/cook`. Under it, the document is `plan.md`, the state is `planning`, the craft skills are `write-plan` and `plan-check`.
- Other stage skills, in any phase: `/quick`, `/auto`, `/guesses`, `/handoff`, `/pickup`.
- Moves back: `reject` to cooking, `replan` to planning, `reframe` to framing when the goal changed. Each move back clears the approval.
- Guards: approved documents are frozen (fingerprints); a new test must fail on the base of the branch; the reviewer is not the builder; the scout reads tickets with no write tools.
- Evidence grades: run, sourced, judged, owner. At the accept, the weakest shows first.
- The kit never approves or accepts for you, never pushes, never reads secrets, and commits only when you say yes.

## 5. Research, learn, wiki, visual

- **Research.** Outputs: an answer in chat for a quick question; `findings.md` and `references/` for a research item; a decision record when the question was a choice; wiki pages for what lasts; a page when you ask. A question splits into sub-questions. Analysts answer in parallel with sources and a confidence (high: two independent sources; medium: one; low: an inference). A fact-checker opens each source again. You accept; the lasting part becomes a wiki page.
- **Learn.** Two kinds: a course to reach a level (a standard, a roadmap, scores), and `/study <topic>` to understand one topic (the facts first, then explain, an example, a check, your notes into the wiki). A course keeps its own folder (`roadmap.md`, `mistakes.md`, `scores.md`, cards, `study.md`); a topic goes into the wiki as a concept page plus one line in the study log. Daily 15 minutes: three of your own sentences, the pattern behind each, one drill. Weekly: one timed task scored on each criterion. Monthly: a band for each skill. Each quarter: a mock test. 80% work English, 20% exam form. You judge your level; the scores are a help, not the truth.
- **Wiki.** One topic for each page, each claim with a source, plain Markdown with `[[links]]`. Agents open the wiki on a condition: when you ask, or when a line of `INDEX.md` matches the item. The index read is cheap; a page read is not.
- **Visual.** Markdown is the record and what agents read. HTML is what you read: one page that you take in at a glance. The pack makes that page for every other pack, from an item, a prompt, a question or a record: walkthrough (`/walkthrough <id or prompt>`), system design, options, report, lesson, topic, progress, brief, week report, retro, deck, sketch. Drawings are inline SVG from the kit, with file and line on each part; charts come from the record rows; Mermaid for a quick diagram in Markdown; canvas rarely. 12 components in one kit; `kit visual diff` builds the annotated diff from git.
- **Three levels of output.** Chat first: the answer in a few lines. Then the Markdown record, always, in full. A page only when you ask, when a stage calls for it, or when the content has a shape that words hide. For large content the agent shows the summary and asks before it makes a page. A page never drops detail; it layers it.

## 6. Version 0, in steps

Each step starts with your expectations as scenarios in `docs/expect/v0.x.md`: what you type, what you get, what you would reject. The step is done when every scenario passes on a real item.

| Step | Parts | Checks |
|---|---|---|
| v0.1 work | core, engineering, the walkthrough page, jira | a session shows every layer; a real item goes from intake to close; the gates refuse the model; a test that cannot fail is caught |
| v0.2 grow and learn | wiki, learn as files, `/brief`, the first `/retro` | an item cites a wiki page; practice on 5 days; the top patterns show; you compare the scores with a real test once |
| v0.3 answer and report | research, `/report week`, `/learn-progress`, the README, the first public release | a real question ends in a wiki page with sources; the week report needs no edit |

After each step, measure: items on the full path against `/quick`; your minutes at the gates; items sent back and why; the context cost of wiki reads and craft skills.

Later, only when real use asks: a main session that sends stages to other folders; more than one Claude account; a learn database with spaced-review cards; a wiki search tool; a board or gate app; voice; more courses and packs.

## 7. Repo

```
harness-kit/
├── package.json                 Bun workspaces
├── packages/shared/             cli, exit codes, config, state, roles
├── packs/                       core, engineering, research, learn, wiki, visual, jira
├── docs/                        this plan, docs/expect/
├── .claude-plugin/marketplace.json
└── LICENSE                      MIT
```

In the repo: skills, agents, hooks, tools, base rules, templates, the English course in our own words, the UI kit.
Never in the repo: your `CLAUDE.md` and rules, ledgers, findings, mistake logs, wiki pages, goals, company names, paths, prompts.
Built-ins such as `/code-review` and `/verify` are tools inside a craft skill. The kit keeps its rubric, its evidence grades and its gates as the contract.

## 8. To decide

| Choice | Recommendation |
|---|---|
| the GitHub owner and the repo name | `harness-kit`; the tool stays `kit` |
| the main screen: desktop app or terminal | one of them, so no session is hidden |
| IELTS Academic or General; the test date; minutes each day | General; 9 to 12 months; 45 to 60 minutes |
