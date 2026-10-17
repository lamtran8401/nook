# Move to nook

> In short: the tool "Harness Kit" (`kit`) is now **nook** (`nook`, short form `nk`). After the merge, do the steps below once, in this order, in your own terminal. Then clean up the old names.

The new names are in `docs/expect/rename-nook.md`.

## Before you start

Close every Claude Code session that runs in an environment.
The reason: after the merge, the old plugins call the old binary, which is gone. Their guards then block each tool call in a session that is still open.
Use a terminal outside Claude Code for every step.

## 1. Merge the branch

```sh
REPO=/Users/admin/Workspaces/personal/projects/harness-kit
git -C "$REPO" merge --ff-only worktree-rename-nook
```

## 2. Rename the repo folder (optional)

Do this step now or never: the marketplace in step 3 records the path.

```sh
mv /Users/admin/Workspaces/personal/projects/harness-kit /Users/admin/Workspaces/personal/projects/nook
REPO=/Users/admin/Workspaces/personal/projects/nook
git -C "$REPO" worktree prune
```

## 3. Change the plugins of Claude Code

Remove the old plugins and the old marketplace, then add the new ones.

```sh
claude plugin uninstall kit@harness-kit
claude plugin uninstall kit-engineering@harness-kit
claude plugin uninstall kit-wiki@harness-kit
claude plugin uninstall kit-learn@harness-kit
claude plugin marketplace remove harness-kit

claude plugin marketplace add "$REPO"
claude plugin install nook@nook
claude plugin install nook-engineering@nook
claude plugin install nook-wiki@nook
claude plugin install nook-learn@nook
```

## 4. Link the commands

```sh
ln -sf "$REPO/apps/nook/bin/nook" ~/.local/bin/nook
ln -sf "$REPO/apps/nook/bin/nook" ~/.local/bin/nk
```

`nk` is for your own typing only. An agent always runs `nook`; the guard blocks an agent that types `nk` or `kit`.

## 5. Move each environment

Run this in each folder that has a `kit.yml`. The list is in `~/.config/kit/environments`.

```sh
cd /Users/admin/Workspaces/personal
nook init --update
nook doctor
```

`nook init --update` makes these changes, and reports each one:

| Before | After |
|---|---|
| `kit.yml` | `nook.yml`, with every line that you wrote |
| `.kit/` | `.nook/`, with the ledger |
| `.claude/rules/kit/` | `.claude/rules/nook/` |
| `.claude/output-styles/kit-companion.md` | `.claude/output-styles/nook-companion.md` |
| `<!-- kit:begin -->` block of `CLAUDE.md` | `<!-- nook:begin -->` block; your lines stay |
| `Bash(kit ...)` and `Edit(.kit/**)` in `.claude/settings.json` | `Bash(nook ...)` and `Edit(.nook/**)`; your other keys stay |

When a folder has both `kit.yml` and `nook.yml`, the update stops and moves nothing. Keep one file, then run it again.

`nook doctor` must report no gap. A gap "an environment of the old name" means that step 5 did not run in that folder.

## 6. Clean up

Remove these old things after step 5:

| What | Command | Why |
|---|---|---|
| the old command | `rm ~/.local/bin/kit` | it points to `apps/kit`, which is gone |
| the old list of environments | `rm -r ~/.config/kit` | nook copied it to `~/.config/nook/environments` |
| the old plugin cache | `rm -r ~/.claude/plugins/cache/harness-kit` | only when step 3 left it |

Then fix the lines that you wrote yourself. The update never changes them:

- `CLAUDE.md` of each environment, outside the block: the folder table names `projects/harness-kit` and "Harness Kit".
- `nook.yml`: the comments that name the kit.

## What stays as it is

- A git branch `kit/<id>-<slug>` in an area keeps working. A new item branch is `nook/<id>-<slug>`.
- `docs/retro/` of the repo keeps the old words: it is the record of its day.

## History

- 2026-10-17: written with the rename.
