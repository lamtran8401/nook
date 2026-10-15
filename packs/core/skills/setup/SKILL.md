---
name: setup
description: "Set up a Harness Kit environment after kit init: read the disk, ask what it cannot settle, write the areas and checks into kit.yml, make the folders, write the map in CLAUDE.md. Use when the owner says setup, set up this folder, or a repo or a check changed."
argument-hint: "[what changed]"
disable-model-invocation: true
allowed-tools: Bash(kit *), Bash(git *), Bash(ls *), Bash(cat *), Read, Glob, Grep, Edit, Write
---

Goal: this folder becomes an environment that an agent can work in with no guess. `kit init` scaffolded the kit. You build the rest with the owner.

## Order
1. Run `kit doctor`. If the folder is not an environment, stop and say to run `kit init` first.
2. Read the disk before you ask anything: `kit.yml`, `CLAUDE.md`, the git repos below (`git -C <dir> remote -v`, the default branch), build files (`package.json`, `pyproject.toml`, `Makefile`, `turbo.json`), scripts, CI files, `.env.example`, the folders that hold docs or notes.
3. Write down what the disk settled: each repo as a candidate area with its kind (`frontend`, `backend`, `docs`, `data`), its checks (the lint, test and build scripts that exist), its test command with `{files}`, its install command from the lockfile.
4. Ask the owner, in one round, only what the disk cannot settle. The usual questions: which candidates are areas; the kind of an area the disk does not show; a check that you could not find; the tracker (jira, github, none); the secret files; where the shelves of the wiki go; a folder for learning. Recommended answers first.
5. Write the sections into `kit.yml`: one section for each pack that is on, by its name (`engineering:`, `wiki:`, `learn:`), with the facts from steps 3 and 4. Keep every line the owner wrote.
6. Make the folders that the packs need and that do not exist: `backlog/`, `work/` (engineering); `wiki/`, `references/` (wiki); the learning folder (learn). Make `spaces/` only when the owner wants it.
7. Write the map of the folder into `CLAUDE.md`, outside the kit block: what each top folder is for, the areas, and the conventions that the owner named. Short, in plain words.
8. Run `kit init --update`, then `kit doctor`. Report: what the disk settled, what the owner decided, what you wrote, and every gap that doctor still lists.

## With an argument
`/setup a new repo spaces/billing`: do steps 2 to 8 for that change only. Add one area, change one check. Move nothing else.

## Gotchas
- Never ask what the disk answers. A `package.json` with a `test` script is the test check.
- A folder that holds two environments that must stay apart (a company and a personal one) gets no packs. Say so when the owner asks for packs there.
- The kit block in `CLAUDE.md` is not yours. Write above or below it.
- A check command that you did not run is a guess. Run each check once in its area before you write it, or mark it "not run".
- Do not write a secret value anywhere. The `secrets` list holds paths only.
