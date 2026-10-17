# Expectation: the desk and the cleanup

> In short: a folder with `nook.yml` is a **desk**. The word "environment" goes from the code, the packs and the docs. The code of the move from the old name `kit` goes. The docs are written again from the code.

## The words

| Old | New |
|---|---|
| environment | desk |
| a boundary, such as `company/` | a top desk |
| `Environment`, `EnvironmentList` | `Desk`, `DeskList` |
| `nearestEnvironment`, `environmentsAbove` | `nearestDesk`, `desksAbove` |
| `packages/env/`, `@nook/env/*` | `packages/desk/`, `@nook/desk/*` |
| `~/.config/nook/environments` | `~/.config/nook/desks` |
| `nook where` prints `env: <dir>` | `nook where` prints `desk: <dir>` |
| plugins `nook-engineering`, `nook-wiki`, `nook-learn` | `nk-eng`, `nk-wiki`, `nk-learn` |
| `/quality-check` | `/deep-review` |

The plugin name is the prefix of each skill and agent, as `/nk-eng:cook`. The core plugin keeps the name `nook`.
`/deep-review` has the word of the board state `review`. The name `/review` is a command of Claude Code.

Desks can nest. `company/` is a top desk; `company/shop/` is a child desk inside it.
"The environment" of a process, such as the env variables or the CI, keeps its word.

## What goes

| Part | Why |
|---|---|
| `packages/core/src/init/rename.ts` and its test | Every desk of the owner has the new names now. |
| The old-name check of `nook doctor` | No desk with `kit.yml` is left. |
| The names `kit`, `kit-eng`, `KIT_` and `.kit` in `names.ts` and the guards | The guards watch one tool, `nook`, and its short form `nk`. |
| The carry of `~/.config/kit` in the desk list | The list of the owner has the new path. |
| `docs/migrate-to-nook.md`, `docs/expect/rename-nook.md` | The move is done. |
| `docs/expect/v0.1.md`, `docs/expect/v0.2.md` | Both steps are built. This file is the one expectation. |
| `docs/retro/` | The retro of a desk lives in that desk, not in the repo. |
| `docs/nook-guide.html` | The viewer of v0.3 makes a page from the Markdown. |

## Scenarios

| Id | Given | When | Then |
|---|---|---|---|
| D-1 | the repo after the cleanup | `bun run check` | the typecheck and every test pass |
| D-2 | the repo | `git grep -i environment -- packages apps plugins` | each match is about a process, not a desk |
| D-3 | the repo | `git grep -E 'kit-eng\|KIT_\|kit\.yml\|\.config/kit'` | no match outside this file and the test of D-5 |
| D-4 | an agent | it runs `nk eng item approve X` | the guard blocks it and says to run the tool as `nook` |
| D-5 | an agent | it runs `kit eng item approve X` | no guard of Nook sees it: `kit` is not a name of the tool |
| D-6 | a desk | `nook doctor` | the report names each desk, the outermost first |
| D-7 | a desk | `nook init --update` | the desk is in `~/.config/nook/desks` |
| D-8 | a folder with `kit.yml` only | `nook doctor` | doctor says the folder is not a desk |
| D-9 | each Markdown file of `docs/` and `plugins/` | `nook ste` | each file passes above 80% |
| D-10 | each fact of README, `CLAUDE.md` and `docs/*.md` | a read of the code | the code shows the fact |

## After the merge

1. Remove the plugins `nook-engineering`, `nook-wiki` and `nook-learn`. Install `nk-eng@nook`, `nk-wiki@nook` and `nk-learn@nook`.
2. Run `nook init --update` in each desk of the owner. It writes the new words into the block and the rules.
3. Remove the old list `~/.config/nook/environments`.
4. Start a new session. The hooks and the output style load at the start.

## Out of scope

- The viewer of v0.3.
- A new behavior of a pack.
