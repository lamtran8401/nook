---
name: setup
description: "Set up a Harness Kit environment after kit init, for each pack that is on: read the disk, ask what it cannot settle, write each pack's section of kit.yml and the map in CLAUDE.md. Use on setup, a new pack, or a changed repo or check."
argument-hint: "[what changed]"
disable-model-invocation: true
allowed-tools: Bash(kit *), Bash(git *), Bash(ls *), Bash(cat *), Read, Glob, Grep, Edit, Write
---

Goal: this folder becomes an environment that an agent can work in with no guess, for every pack that is on. `kit init` scaffolded the kit and the folders of each pack. You write the rest with the owner.
Run it again after a pack is turned on: `kit init` then says which pack needs its section.

## Order
1. Run `kit doctor`. If the folder is not an environment, stop and say to run `kit init` first. Each line that starts with a pack name is a gap of that pack: this run must close it.
2. Read the disk before you ask anything: `kit.yml`, `CLAUDE.md`, the git repos below (remote, default branch), build files, scripts, CI files, `.env.example`, the folders of docs or notes.
3. Write down what the disk settled: each repo as a candidate area with its kind (`frontend`, `backend`, `docs`, `data`, `tool`), its checks (the lint, test and build scripts that exist), its test command with `{files}`, its install command from the lockfile.
4. Ask the owner, in one round, only what the disk cannot settle. The usual questions: which candidates are areas (an area is guarded: its files change only through an item in cooking, so a repo that you edit by hand stays out); the kind of an area the disk does not show; a check that you could not find; the tracker (jira, github, none); the secret files; where the shelves of the wiki go; a folder for learning. Recommended answers first.
5. Write the sections into `kit.yml`: one section for each pack that is on, by its name (`engineering:`, `wiki:`, `learn:`), with the facts from steps 3 and 4. Keep every line the owner wrote.
6. Make `projects/` only when the owner wants it. `kit init --update` in step 8 makes the folders of each pack (`work/`, `backlog/`, `docs/adr/` for engineering).
7. Write the map of the folder into `CLAUDE.md`, outside the kit block: what each top folder is for, the areas, and the conventions that the owner named. Short, in plain words.
8. Run `kit init --update`, then `kit doctor`. Report: what the disk settled, what the owner decided, what you wrote, and every gap that doctor still lists. A pack gap that is left is not done: say why.

## With an argument
`/setup a new repo projects/billing`: do steps 2 to 8 for that change only. Add one area, change one check. Move nothing else.

## Gotchas
- Never ask what the disk answers: a `test` script in `package.json` is the test check.
- A folder that holds two environments that must stay apart (company and personal) gets no packs.
- The kit block in `CLAUDE.md` is not yours. Write above or below it.
- A check that you did not run is a guess. Run each one once in its area, or mark it "not run".
- Do not write a secret value anywhere. The `secrets` list holds paths only.
