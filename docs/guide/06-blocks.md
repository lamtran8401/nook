# 6. When something blocks

> In short: a guard that stops a call names the reason and the fix. Do the fix; never work around the guard. When Nook itself fails, every guard blocks, and only you can repair it with a `!` command.

## First steps

1. Read the line of the guard. It says what broke the rule and what to do.
2. Run `nook doctor`. Each gap comes with its fix.
3. Type `/checkup`. The companion fixes the gaps that are the agent's and lists the gaps that are yours.

## Common blocks

| The guard says | Why | Fix |
|---|---|---|
| `… is a secret file: Nook does not read secrets.` or `… Nook never writes one.` | env files, `.npmrc`, `~/.ssh`, `~/.aws`, `~/.config/twg`, `~/.config/gh` and the `secrets` of `nook.yml` are never read or written by the model | Give the value in chat, or point to `.env.example`. |
| `… is in the state folder: the nook commands write it, not an edit.` | `.nook/` holds the ledger | Use a `nook` command. |
| `… holds the permissions: the owner edits it, or nook init --update.` | `.claude/settings*.json` changes only by you or by Nook | Edit it yourself, or run `nook init --update`. |
| a block on an owner move | approve, accept and mode are yours | Type `/gate <move> <id>` in the prompt. |
| a block on `nk` | the one name of the tool is `nook`; the engineering guard blocks `nk` in each shell call of Claude Code | Run `nook`. |
| `a reader never writes a file.` | read-only agents report; they do not edit | The lead or a builder makes the change. |
| a block on `spec.md`, `plan.md` or `tasks.md` | a document opens only in its state, and the approve freezes it | `nook eng item replan <id>` or `reframe <id>` with a reason. |
| a block on a file of an area | an area changes only while one of its slices runs | Start the slice through `/cook` or `/quick`. |
| `the plugin … of the pack … is off` (from `nook doctor`) | the plugin of a pack is not installed or not on, so its hooks and skills do not run | Run the fix on the line, such as `claude plugin install nk-eng@nook`, then start a new session. |
| `… % of … sentences pass the writing standard` | a Markdown file under `docs/`, `works/` or `backlog/` scored 80% or less | Rewrite the listed sentences: 25 words or fewer, no should, may or might. |

## The session does not stop

The Stop hook holds the lead in two cases:

- A blocking question of its item is open. Answer it.
- A yolo run waits for the next stage of the lead. The reason names the skill file.

It lets go after six holds in a row, so a loop cannot run forever.

## Nook itself fails

The hooks run the Nook code. When `nook` cannot start, each guard blocks each call, and the agent cannot repair it. The message of the guard names your repair. It is one line; here it shows on three:

```
nook: Nook itself failed (exit 1), so this guard blocks the call. The owner repairs Nook with a ! command.
Cannot find package: ! cd <nook repo> && bun install.
A broken file: ! git -C <nook repo> status, then ! git -C <nook repo> checkout -- <the broken file>
```

Type the `!` command in the Claude Code prompt. It runs in the session, outside the guards.

| Message | Usual cause | Repair |
|---|---|---|
| `Cannot find package 'yaml'` | a merge moved a package, and its links are old | `! cd <nook repo> && bun install` |
| a syntax or type error in a Nook file | an edit of the Nook code broke it | `! git -C <nook repo> checkout -- <the file>` |

## After an update of Nook

1. Run `bun install` in the Nook repo.
2. Run `nook init --update` in each workspace.
3. Start a new Claude Code session. Claude Code loads the hooks and the persona only at the start of a session.
4. Run `nook doctor`.
