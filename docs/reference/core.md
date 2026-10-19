# The core: the contract

> In short: the core is what every desk has: the `nook` tool, `nook.yml`, the base rules, the persona, the secret guards, the writing check and the owner's gate. The code is in `packages/core/`, `packages/desk/` and `packages/shared/`; the plugin is `plugins/core/`.

When the code and this file do not agree, fix one of them in the same change.

## 1. Words

| Word | Meaning |
|---|---|
| desk | a folder with `nook.yml` |
| top desk | a desk with no desk above it, such as `company/` |
| child desk | a desk inside another desk, such as `company/shop/` |
| pack | a plugin with rules, settings keys, state, skills, agents and hooks: core, engineering, wiki, learn |
| home of a pack | the nearest desk above a folder that turns the pack on; the record of the pack lives there |
| owner | the person; a process that Claude Code did not start, or a move that the owner typed |

## 2. The file `nook.yml`

```yaml
packs: [engineering, wiki]          # or { on: [engineering], off: [wiki] }
rules: { off: [writing] }           # base rules that init does not write
secrets: [config/prod.yml]          # more secret files, relative to this desk; paths only

engineering: { ... }                # one section for each pack, read by that pack
```

| Key | Type | Default | Rule |
|---|---|---|---|
| `packs` | a list, or a map with `on` and `off` | none | The packs of a folder are the union of each `nook.yml` above it, less each `off`. |
| `rules.off` | a list of rule names | none | `nook init` does not write these rules; `nook init --update` removes their files. |
| `secrets` | a list of paths | none | The guards block each path as a secret file. |
| `<pack>` | a map | the defaults of the pack | Each pack reads its own section; see its reference. |

A fault stops the command and names the key: `packs.on must be a list of strings`.

## 3. Commands of the core

| Command | What it does |
|---|---|
| `nook init [--pack a,b] [--update]` | makes this folder a desk; `--update` writes again only what Nook owns |
| `nook doctor` | the desks above, the packs of each, every gap with its fix |
| `nook packs` | the packs on here, where each keeps its record, and the packs that Nook ships |
| `nook brief` | what waits for you, what is done since yesterday and what runs, for each desk of the desk list |
| `nook web [--build]` | the desk in the browser: builds the web app when the Nook code changed, then serves it on `127.0.0.1` until Ctrl-C |
| `nook web pair` | prints a one-time link that pairs one more browser with the web app that runs |
| `nook web forget` | removes each paired browser; the pages stay free to read |
| `nook retro` | the facts since the last retro of this desk: items sent back, guesses flipped, slow questions, weak proofs |
| `nook where` | the desks above this folder and the Nook repo |
| `nook ste <file\|folder...> [--min N] [--quiet]` | the writing score of Markdown files; a file passes above `N`, default 80 |
| `nook hook <name>` | one core hook, with the Claude Code event on stdin |

Each pack adds its commands under its name: `nook eng …`, `nook wiki …`, `nook learn …`. `nook --help` lists all 93 commands.

`nook web` runs only in the owner's terminal:

1. It refuses when `CLAUDECODE` is set or a Claude session stands above it, so no agent starts the app or holds a pair token. The shell guard also blocks `nook web` from an agent.
2. It refuses while the server of an earlier start still runs for the desk.
3. It stops when Node 24 or later is not on the path, and names the install.
4. It builds `apps/web` when the hash of the sources differs from the stamp of the last build, or with `--build`. The hash covers the web app, the package sources, the `package.json` and `tsconfig` files and `bun.lock`. A failed build names its error lines and starts no server.
5. It takes the last port of the desk when it is free. When another program holds it, it takes a free port and prints the new address.
6. It starts `apps/web/server.ts` under Node and keeps its stdin open. The server stops when `nook web` ends, also when its terminal closes.
7. It writes the port and the process to `.nook/web.json`. After the stop, the file keeps the port, so a bookmark keeps working.
8. It pairs the default browser: it opens a link with a new pair token, through a page that only the owner can read.

Each page is free to read on the host `127.0.0.1:<port>`; the server refuses each other host. An owner move needs a paired browser:

| Part | Rule |
|---|---|
| pair token | works once, within 2 minutes; only its hash is in `.nook/web-pairs.json` |
| session | an HttpOnly, SameSite=Strict cookie of 30 days, whose name holds the port; it stays through a restart |
| read with no pair | the page shows, with a View only note; each owner button is off and names `nook web pair` |
| write | needs a session and the origin of the page; with no session, the answer is 401 |

The answer to a pair token is a page that sets the cookie and then moves to the address itself. A browser sends no Strict cookie on a navigation that another site started, and the page on the disk that holds the token counts as another site.

`nook web pair` pairs one more browser, such as Safari: it prints a pair link on the port of the server that runs. `nook web forget` removes each pair; each browser loses its session at its next request. Both refuse in Claude Code, as `nook web` does.

The shell guard blocks a call to the port in `.nook/web.json` on any spelling of this machine, such as `127.1:<port>`, `localhost <port>` or `/dev/tcp/127.0.0.1/<port>`. A broken `web.json` blocks each shell call until the owner deletes it.

Each page of the web app reads the desk when the browser asks for it. A gap of the desk, such as a ledger that needs a migration, shows with its fix in place of the data.

| Page | It shows |
|---|---|
| `/` | four counts on top; what waits in groups by item, each line with its command; then what runs and what is done |
| `/works` | the board: one column for each state that holds an item; a card shows its flags and whose move is next; a click opens the item in a dialog |
| `/works/<id>` | the item: a head with its chips, then a tab for the Overview and one for each document |
| `/wiki` | the drafts that wait for a yes, then a group for each shelf: each page with its summary and type |
| `/wiki/<shelf>`, `/wiki/<page>` | one shelf, or one page with its blocks and its links; a `[[name]]` links to its page |
| `/learn`, `/learn/<course>` | the courses; a course gives its cards due, the top patterns of the mistakes, and the bands of each criterion |
| `/search?q=<words>` | each line that holds every word, in the item documents, the wiki and the courses, in groups by file, as a link to its page |

The Overview of an item gives the states of the flow with their times, the next step and its owner, four numbers, Needs you, the slices on a board, the branch and checks of each area, and the events. Needs you lists the blocking questions first, then the open questions, the guesses to check and the gate. A document tab renders its file block by block; a document not written yet names the command that writes it, such as `/view SHOP-12` for the walkthrough. Each tab has its own address, such as `/works/SHOP-12?tab=plan`.

The owner moves on the page of an item: the Approve or Accept button of the next step, the Mode switch of the head, an answer box for each open question, and Accept and Flip for each guess to check. Each one runs the `nook` that started the web app, with `--via viewer`, so it meets the guards of `/gate`. A refused move shows the gaps and their fixes word for word. A move that goes through renders the page again through `/live`.

The chart of a course draws a line for each criterion with a score on every day of the chart; it never fills a missing day. A place with nothing in it yet shows what is missing and the command to type.

The search box reads the Markdown files of each pack again at each search, so a page changed a moment ago gives its new words. It keeps no index. It never reads a secret file and never follows a link.

An open page renders again by itself when the desk changes, with no reload, within a second. `/live` sends an event when a file of a pack folder or the ledger in `.nook/` changes; a burst of writes gives one event. A change in the code of an area sends none.

`bun run demo <dir>` builds a desk with mock work items in a new folder: one item in each state of the flow, made through the real moves. Open it with `nook web` from a terminal outside Claude Code.

On the home, a gate line has its button, such as Approve, and an answer line links to its item. A line of no item, such as a gap of `nook doctor`, sits under This desk. Each command shows as code with a copy button.

`nook doctor` and `nook brief` only read. `readHome(desk, modules)` in `packages/core/src/read.ts` gives the same brief of one desk and the findings of its doctor, for the home page of the web app.

The exit codes hold for every command except the hooks. A hook exits 0 to let a call go and 2 to block it, as Claude Code reads them.

| Exit | Meaning |
|---|---|
| 0 | ok |
| 1 | error |
| 2 | usage |
| 3 | refused: a guard or a state rule; the message lists the gaps and their fixes |
| 4 | conflict: the record changed after the caller read it (`--if-version`) |
| 5 | denied: the role of the caller cannot do it |

## 4. What `nook init` writes

| Part | Where | On `--update` |
|---|---|---|
| the packs | `nook.yml` | made once; a later init only adds packs |
| the Nook block | `CLAUDE.md`, between `<!-- nook:begin -->` and `<!-- nook:end -->` | written again |
| the base rules | `.claude/rules/nook/<rule>.md`, one file for each rule of a pack that is on | written again |
| the persona | `.claude/output-styles/nook-companion.md` | written again |
| the settings keys | `.claude/settings.json` | its keys merged; other keys kept |
| the state | `.nook/` and the folders of each pack | made when missing |
| the desk list | `~/.config/nook/desks` | the desk added |

Each other line is the owner's. `nook init` never changes it.

## 5. The base rules

| Rule | Pack | It holds |
|---|---|---|
| `writing` | core | Simplified Technical English for files: 25 words at most in a sentence, must and can, one term for one meaning |
| `safety` | core | no secret read, no state or settings edit, no push, commit only on request, only the owner at a gate |
| `questions` | core | ask with a choice box, only blocking questions, one round of four at most, the recommended answer first |
| `approach` | core | the right way, not the shortest: fix the cause, one home for one job, no patch on a patch, say when the right way costs more |
| `comments` | core | comment only hard logic in one or two lines: what and why; no history and no code in a comment |
| `engineering`, `testing` | engineering | the flow, git, code and tests; see the engineering reference |
| `wiki` | wiki | read the index first, cite each page, write after a yes |
| `learn` | learn | the record through `nook learn`, the owner's own words, scores with evidence |

## 6. The hooks of the core

The file is `plugins/core/hooks/hooks.json`. Each hook runs `nook hook <name>` and does nothing outside a desk.

| Event | Hook | Job | On a failure of Nook |
|---|---|---|---|
| PreToolUse Read, Grep, Glob | `read` | blocks a secret file | blocks |
| PreToolUse Bash | `bash` | blocks a secret in a command, a state database, a role set by a command, a nested session that types `/gate`, a call to the port of a running web app | blocks |
| PreToolUse Edit, Write | `edit` | blocks a secret file, the state folder, `.claude/settings*.json` | blocks |
| PostToolUse Edit, Write | `style` | scores a Markdown file under `docs/` of the desk, or under a folder that a pack names as its record, such as `works/` and `backlog/` of engineering; sends back the failing sentences, and each `bench` block that does not match the schema of `DIAGRAMS.md` | lets go |
| SessionStart | `start` | the desk, its packs and the hint `nook doctor`, as context | lets go |
| UserPromptExpansion `/gate`, `/yolo` | `gate` | runs the owner move that the owner typed | lets go |

The secret files, the same for the read, shell and edit guards:

- `.env`, `.env.local`, `.env.<name>` and `<name>.env`; `.env.example` passes.
- `.npmrc`, each file under `~/.ssh`, `~/.aws`, `~/.config/twg` and `~/.config/gh`.
- Each path in `secrets` of a `nook.yml` above.
- In a command, `process.env` and `Bun.env` are code, not files. `$HOME/.env` and `--env-file=.env` name a file and block.

The list lives in `packages/desk/src/secrets.ts`, so the guards and the read paths of every pack use the same one.

The shell guard blocks a state database in two ways: a word that names a `.db` file under `.nook/`, and a word that is the SQLite shell. The guard reads the words as the shell does: quotes join a word, and the code inside `$(...)`, backticks, `eval` and `sh -c` adds its words. A shell with no `-c` runs its input, so then each quoted word and each heredoc body of the command counts as code. A word that only contains the name, such as the search pattern `"x\|sqlite"`, passes.

Every shell guard reads a `#` or a `<<` inside quotes as text, so a comment or a heredoc never hides the rest of a line.

The gate hook:

- `/gate` alone lists the owner moves that wait.
- `/gate <move> <id>` runs the move of the pack that owns it, as `owner via /gate`.
- It refuses inside an agent, and in a session that a tool started.

The plugin shim `bin/nook` runs the binary of the repo that holds the plugin, then `NOOK_PROJECT`, then `nook` on the `PATH`. When Nook itself fails, a guard hook blocks and names the repair; another hook lets the session go on.

## 7. Skills of the core

| Skill | Use |
|---|---|
| `/setup [what changed]` | reads the disk, asks what it cannot settle, writes the section of each pack and the map in `CLAUDE.md` |
| `/checkup` | runs `nook doctor`, fixes the agent's gaps, lists the owner's |
| `/gate [approve\|accept\|mode] [<id>] [yolo\|normal]` | the owner's moves; a hook runs the move before the skill text |
| `/brief` | the daily brief in chat; writes no file |
| `/retro` | the causes since the last retro, the change for each, picked by the owner; writes `docs/retro/<date>.md` |
| `/grill-me <the decision>` | one open question at a time, an example for each adjective; writes `docs/grill/<date>-<slug>.md` |

Only the owner starts these skills.

## 8. Settings

`plugins/core/templates/settings.json` gives these keys:

| Key | Value |
|---|---|
| allow | `Bash(nook *)`, `git status`, `git diff`, `git log`, `git show`, `git branch --list`, `rg` |
| ask | `git commit`, `git push`, `git pull`, `git fetch`, `git worktree`, `docker` |
| deny | a forced push, `git reset --hard`, `git clean`, reads of env files, `.npmrc`, `~/.ssh`, `~/.aws`, `~/.config/twg` and `~/.config/gh`, edits of env files, `.nook/` and the settings files |
| `outputStyle` | `nook-companion` |
| `env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` | `1` |
| `teammateMode` | `auto` |

## 9. The persona

`nook-companion` is the output style of each desk. The companion talks as a coworker, a coordinator, an advisor and a consultant:

- Chat first, then the Markdown record, then a page only when it helps.
- Each report starts with what waits for the owner.
- At the end of a phase, at most 8 points that can change a decision of the owner.
- A subagent for a one-shot job; a teammate only for a builder with two slices or more in one area.
- The chat follows the owner's language. No correction of the owner's English in the work chat.

## 10. Names

| Name | Use |
|---|---|
| `nook` | the command; hooks and agents run it by this name only |
| `nk` | not a command of Nook; the engineering guard blocks it in each shell call of Claude Code, so an alias of yours cannot run as an agent |
| `NOOK_ROLE`, `NOOK_ACTOR`, `NOOK_SESSION` | set by the hooks only; a command that sets one is blocked |
| `NOOK_PROJECT` | the Nook repo, for a shim that cannot find it |
| `.nook/` | the state folder of a desk |
| `.claude/rules/nook/` | the base rules of a desk |

`nook`, `nk` and the role variables live in `packages/shared/src/names.ts`. `.nook/` lives in `packages/desk/src/desks.ts`. `NOOK_PROJECT` lives in the shims `plugins/*/bin/nook`.

## 11. The UI kit

`plugins/core/ui/bench/` holds the Bench design system: `tokens.json`, `bundle.css` and `bundle.js`. The pages that Nook builds, such as `nook eng item page`, put it inline. `SOURCE.md` names the source artifact and the version. Nook never edits these files.

The web app uses the same files. Its layout puts the tokens and `bundle.css` inline and loads `bundle.js` at the end of the page. Its components in `apps/web/components/` render the `bn-*` markup with React:

| Component | Shows |
|---|---|
| `Board`, `ItemCard` | one column for each state that holds an item, in the order of the flow; each card links to its item |
| `ItemHeader` | the title, the chips and the next step, with the button when the step is the owner's |
| `Criteria` | each criterion with its number, its state and its evidence |
| `Diagram` | a Bench diagram from its spec |
| `Gap` | a gap of the desk with its fix, in place of the data |
| `TabLinks`, `PackNav` | Home, and a tab for each pack on in the desk that has a page |

A document becomes a page in two steps: `apps/web/lib/blocks.ts` turns its Markdown into blocks, and `apps/web/components/blocks/` renders each block with one Bench component.

| Block | Markdown | Component |
|---|---|---|
| prose | headings, paragraphs, lists, dividers | Prose |
| table | a GFM table | Table |
| quote | `>` | Quote |
| code | a fence with a language | CodeBlock |
| panel | `:::info`, `:::note`, `:::success`, `:::warning`, `:::error` | Alert |
| decision | `:::decision` | Alert with a decision mark |
| expand | `:::expand Title` | Accordion |
| columns | `:::columns`, with `---` between the columns | Grid |
| task list | `- [ ]` and `- [x]` | Checklist |
| status, date | `{status:done}`, `{date:2026-10-18}` in a line | Badge, date chip |
| diagram | a fence `bench` with a JSON spec, a `mermaid` flowchart, sequenceDiagram or erDiagram, or a `tree` of files | Diagram |

A `:::` block ends at a line with `:::` alone, and may hold another block. An unknown block, a broken `bench` block and an unclosed `:::` show as a warning that names the line. Raw HTML shows as text. A link to a site other than `http` or `https` shows as its words.

The first list under one of these headings follows the heading:

| Heading | Becomes |
|---|---|
| `## Acceptance criteria` | records, each with its kind, its sources and its state from the ledger |
| `## Details` | rules, each with its sources; a guess shows its impact |
| `## What works now` | piece cards in plain words |
| `## Where to start reading`, `## Try it` | step lists; a step of Try it splits into what to do and what you see |
| `## Out of scope`, `## Heads up`, `## Requirements met` | an out list, an alert of things to know, a met checklist |
| `## T1: title` with `- key: value` lines | a task card |

A quote that opens with `In short:` or `Need to know:` is a callout, and a line `None: Cache, Consistency.` gives the chips of no impact.

A `mermaid` flowchart gives Bench the nodes and the edges with no places, and Bench lays the graph out. A node tagged `(new)`, `(changes)` or `(error)` takes the colour of that role, a first node with no tag is the start, and the legend names each role that the drawing uses. An area of the item before a colon, such as `web: the page`, is the kicker of the node. A `subgraph` is a group, one column. A `tree` fence lists files, two spaces for each level, each line as `name  state  note`. A mermaid kind with no drawing shows as a warning.

A component never uses `data-bn-diagram` or `data-bn-icon`: `bundle.js` changes those nodes at load, before React hydrates them. `Diagram` keeps its spec in `data-nook-diagram` and draws after hydration.

`bun run e2e` checks the layout of each diagram. It draws in headless Chrome each JSON example of `DIAGRAMS.md`, each drawn fence of the Markdown under `docs/` and `plugins/`, and each figure of the two doc pages. The check fails on these faults, and names the diagram and the fault:

| Fault | Example |
|---|---|
| an edge goes through a node that is not its end | `the edge a → c goes through the node b` |
| two edge labels are less than 6 px apart | `the labels "imports" and "reads" are 2 px apart` |
| a label sits on another edge or on a node | `the label "status" sits on the edge api → bad` |
| an edge leaves or enters its node backwards | `the edge web → q leaves or enters its node backwards` |
| a spec does not draw | `Diagram not drawn: unknown diagram type "pie"` |
| a font of Bench did not load | `the font Be Vietnam Pro of Bench did not load` |

A split or a merged line may pass under the label of its partner line, at their join. The test also lists each file that has drawn fences; a new one must join that list. The check needs Google Chrome; `NOOK_CHROME` names another path. It also needs the network for the Bench fonts, because a fallback font gives other sizes.

## 12. The repo

```
nook/
├── apps/nook/            the binary nook: it joins the commands of each package; no logic
├── apps/web/             the web app of nook web: Next.js on Node, its own tsconfig; bun run e2e builds it
├── packages/
│   ├── shared/           the CLI router, the exit codes, the hook input and output, the names, the SQLite file, the command runner
│   ├── desk/             desks, nook.yml, the desk list, the pack manifests, the plugin folders, the UI kit
│   ├── core/             init, doctor, packs, where, ste, brief, retro, the core hooks
│   ├── engineering/      the ledger, the item machine, the guards, the documents, git, the hooks
│   ├── wiki/             the shelves, their indexes, the link check
│   ├── learn/            the courses: roadmap, cards, mistakes, scores, the study log
│   └── ui/               the UI base of the web app: the shadcn/ui parts and the Tailwind theme from the Bench tokens
├── plugins/<pack>/       pack.json, .claude-plugin/, bin/nook, skills/, templates/, and agents/, hooks/ or ui/ where a pack has them; no code
├── docs/                 the guide book, the reference, the report, the expectation
└── .claude-plugin/       the marketplace
```

The dependency rule: `apps/nook` and `apps/web` import the packages. A package imports `@nook/shared/*` and `@nook/desk/*` only, never another pack; `packages/ui` imports no `@nook` package. Each package names the `@nook` packages that it imports in its `package.json`, so Node finds them. A plugin holds no code: its hooks call `bin/nook`.

Every package runs under Bun and under Node, so the web app can import it. The SQLite file and the command runner of `shared` use `node:sqlite` and `node:child_process`. A test fails when a package source uses a Bun API.

`pack.json` of a plugin names its rules, its settings file and its state files. `nook init` reads it.
