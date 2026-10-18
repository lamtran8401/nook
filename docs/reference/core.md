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
| `nook retro` | the facts since the last retro of this desk: items sent back, guesses flipped, slow questions, weak proofs |
| `nook where` | the desks above this folder and the Nook repo |
| `nook ste <file\|folder...> [--min N] [--quiet]` | the writing score of Markdown files; a file passes above `N`, default 80 |
| `nook hook <name>` | one core hook, with the Claude Code event on stdin |

Each pack adds its commands under its name: `nook eng …`, `nook wiki …`, `nook learn …`. `nook --help` lists all 91 commands.

`nook web` runs only in the owner's terminal:

1. It refuses when `CLAUDECODE` is set, so no agent starts the app or holds its token.
2. It stops when Node 24 or later is not on the path, and names the install.
3. It builds `apps/web` when the hash of the web and package sources differs from the stamp of the last build, or with `--build`. A failed build names its error lines and starts no server.
4. It takes the last port of the desk when it is free, else a free one, and makes a one-time token.
5. It starts `apps/web/server.ts` under Node with `NOOK_DESK` and the port, and writes the token to its stdin. The token is never in an argument, a variable, a file or the terminal.
6. It writes the port and the process to `.nook/web.json`, opens the browser with the token, and removes the file when the server stops.

The server lets a request in only on its own host `127.0.0.1:<port>`. The token works once and becomes an HttpOnly, SameSite=Strict cookie; a write needs the origin of the page.

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
| PostToolUse Edit, Write | `style` | scores a Markdown file under `docs/` of the desk, or under a folder that a pack names as its record, such as `works/` and `backlog/` of engineering; sends back the failing sentences | lets go |
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
│   └── learn/            the courses: roadmap, cards, mistakes, scores, the study log
├── plugins/<pack>/       pack.json, .claude-plugin/, bin/nook, skills/, templates/, and agents/, hooks/ or ui/ where a pack has them; no code
├── docs/                 the guide book, the reference, the report, the expectation
└── .claude-plugin/       the marketplace
```

The dependency rule: `apps/nook` and `apps/web` import the packages. A package imports `@nook/shared/*` and `@nook/desk/*` only, never another pack. Each package names the `@nook` packages that it imports in its `package.json`, so Node finds them. A plugin holds no code: its hooks call `bin/nook`.

Every package runs under Bun and under Node, so the web app can import it. The SQLite file and the command runner of `shared` use `node:sqlite` and `node:child_process`. A test fails when a package source uses a Bun API.

`pack.json` of a plugin names its rules, its settings file and its state files. `nook init` reads it.
