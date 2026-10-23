# 1. Start

> In short: install Nook once, then make a workspace in each folder that you want. It takes about ten minutes.

## What you need

- [Bun](https://bun.sh) 1.4 or later.
- Claude Code, in the terminal or the desktop app.
- macOS. Nook is built and used on macOS; other systems are not tested.

## Install Nook

Do these steps once, in a terminal:

```
git clone <the nook repo> nook && cd nook && bun install
ln -s "$PWD/apps/nook/bin/nook" ~/.local/bin/nook
claude plugin marketplace add "$PWD"
claude plugin install nook@nook
```

| Line | Why |
|---|---|
| `bun install` | The hooks run the Nook code. Without its packages, every hook fails. |
| `nook` | The hooks and the agents run this command. The guards watch for this name. |
| `nook@nook` | The one plugin: every skill, agent and hook. A feature works only where `nook.yml` turns it on. |

Check the install: `nook --help` lists the commands.

## Make your first workspace

Pick a folder, such as `personal/`. Open a terminal in it and run:

```
nook init --with engineering,wiki
```

The command writes these files. Each other line in the folder stays yours.

| File | What it holds |
|---|---|
| `nook.yml` | one section for each feature that is on, and later your secrets, budget and command lists |
| `CLAUDE.md` | a Nook block between `<!-- nook:begin -->` and `<!-- nook:end -->` |
| `.claude/rules/nook/` | the base rules, one file for each rule of a feature that is on |
| `.claude/output-styles/nook-companion.md` | the persona of the companion |
| `.claude/settings.json` | the Nook keys: permissions, the rules of your command lists, the output style, agent teams |
| `.nook/` | the state, such as the ledger of engineering |

A feature also makes its folders: `works/`, `backlog/` and `docs/adr/` for engineering, `docs/wiki/` and `docs/references/` for the wiki. To turn a feature on later, add its section to `nook.yml` or run `nook init --with <feature>`.

## Set up the workspace

Start Claude Code in the folder and type `/setup`. The skill does four things:

1. It reads the disk: the git repos, the scripts, the CI files, the folders of notes.
2. It asks you, in one round, only what the disk cannot answer. Example: "Is `projects/shop/api` an area?"
3. It writes the section of each feature into `nook.yml`, and a map of the folder into `CLAUDE.md`.
4. It runs `nook doctor` and reports each gap that is left.

An **area** is a repo that changes only through an item. Keep a repo that you edit by hand out of the areas.

## Check the workspace

```
nook doctor
```

A good workspace prints one line at the end:

```
✓ 1 workspace above, 3 features on, no gap
```

A gap comes with its fix. Example:

```
Gaps:
  ! engineering: area api has no checks: verify fails until set
      fix: add checks: [<command>] to the area in nook.yml, or checks: [] for none
```

Do the fix, then run `nook doctor` again. `nook doctor` exits 1 while an error gap is left, so a script can check it.

## Next

- Run `/setup <what changed>` after a new repo or a changed check. Example: `/setup a new repo projects/billing`.
- Run `nook init --update` after you update Nook. It writes again only what Nook owns.
- Start a new Claude Code session after an update. Claude Code loads the hooks and the persona at the start of a session.
- Read [chapter 3](03-day.md) for a normal day.
