# Expectation: the rename to nook

> In short: the tool "Harness Kit" (`kit`) becomes **nook**. Every name changes in one step. An environment of the old name moves to the new names with `nook init --update`.

## The names

| Old | New |
|---|---|
| Harness Kit, `kit` | Nook, `nook` (second command: `nk`) |
| `@kit/*` | `@nook/*` |
| `apps/kit`, `bin/kit` | `apps/nook`, `bin/nook` |
| plugins `kit`, `kit-engineering`, `kit-wiki`, `kit-learn` | `nook`, `nook-engineering`, `nook-wiki`, `nook-learn` |
| marketplace `harness-kit` | marketplace `nook` |
| `kit.yml` | `nook.yml` |
| `.kit/` | `.nook/` |
| `.claude/rules/kit/` | `.claude/rules/nook/` |
| output style `kit-companion` | `nook-companion` |
| `<!-- kit:begin -->` | `<!-- nook:begin -->` |
| `KIT_PROJECT`, `KIT_ROLE` | `NOOK_PROJECT`, `NOOK_ROLE` |
| branch `kit/<id>-<slug>` | branch `nook/<id>-<slug>` |
| `~/.config/kit/environments` | `~/.config/nook/environments` |

"UI kit" is the Bench component set. It keeps its name.

## Scenarios

| Id | Given | When | Then |
|---|---|---|---|
| R-1 | the repo after the rename | `bun run check` | the typecheck and every test pass |
| R-2 | an agent | it runs `nook eng item approve X`, `nk eng item accept X` or `kit eng item mode X` | the guard blocks each one as an owner move |
| R-3 | an agent | it sets `NOOK_ROLE=lead` or `KIT_ROLE=lead` in a command | the guard blocks it |
| R-4 | an agent | it opens `.nook/engineering.db` or `.kit/engineering.db` in the shell | the guard blocks it |
| R-5 | an environment with `kit.yml`, `.kit/`, `.claude/rules/kit/`, the old block and the old settings | `nook init --update` | the files move to the new names; the old block, the old rules folder and the old settings rules are gone; the owner's lines stay |
| R-6 | the same old environment | `nook doctor`, before the update | doctor names the old environment and the fix `nook init --update` |
| R-7 | an environment with both `kit.yml` and `nook.yml` | `nook init --update` | the update stops and names both files; it never overwrites one |
| R-8 | a migrated environment | `nook init --update` again | nothing moves; the report says kept |

## Out of scope

- A general workflow engine. Engineering stays the one workflow.
- The repo folder name `projects/harness-kit`. The owner can rename it; see `docs/migrate-to-nook.md`.
- `docs/retro/`: a record of its day keeps its words.
