---
name: setup
description: "Set up a Nook desk after nook init, for each pack that is on: read the disk, ask what it cannot settle, write each pack's section of nook.yml and the map in CLAUDE.md. Use on setup, a new pack, or a changed repo or check."
argument-hint: "[what changed]"
disable-model-invocation: true
allowed-tools: Bash(nook *), Bash(git *), Bash(ls *), Bash(cat *), Read, Glob, Grep, Edit, Write
---

Goal: this folder becomes a desk that an agent can work in with no guess, for every pack that is on. `nook init` wrote `nook.yml`, the Nook block and the rules. You write the rest with the owner; step 8 makes the folders of each pack.
Run it again after a pack is turned on: `nook init` then says which pack needs its section.

## Order
1. Run `nook doctor`. If the folder is not a desk, stop and say to run `nook init` first. Each line that starts with a pack name is a gap of that pack: this run must close it.
2. Read the disk before you ask anything: `nook.yml`, `CLAUDE.md`, the git repos below (remote, default branch), build files, scripts, CI files, `.env.example`, the folders of docs or notes.
3. Write down what the disk settled: each repo as a candidate area with its kind (`frontend`, `backend`, `docs`, `data`, `tool`), its checks (the lint, test and build scripts that exist), its test command with `{files}`, its install command from the lockfile.
4. Ask the owner, in one round, only what the disk cannot settle. The usual questions: which candidates are areas (an area is guarded: its files change only through an item in cooking, so a repo that you edit by hand stays out); the kind of an area the disk does not show; a check that you could not find; the pack issue-tracker with its sources (a Jira site, a GitHub repo), or none; the secret files; where the shelves of the wiki go; a folder for learning. Recommended answers first.
5. Write the sections into `nook.yml`: one section for each pack that is on, by its name (`engineering:`, `wiki:`, `learn:`), with the facts from steps 3 and 4. Keep every line the owner wrote.
   For `wiki:`, list each shelf that exists in `docs/wiki/` with its use in one sentence, and `index: false` for a shelf of dated notes such as `daily/`. Move no page; then run `nook wiki index --fix`.
   For `learn:`, write `dir: learn`, the folder of the courses. A course gets its files later, with `/learn-setup <course>`.
6. Make `projects/` only when the owner wants it. `nook init --update` in step 8 makes the folders of each pack (`works/`, `backlog/`, `docs/adr/` for engineering).
7. Write the map of the folder into `CLAUDE.md`, outside the Nook block: what each top folder is for, the areas, and the conventions that the owner named. Short, in plain words.
8. Run `nook init --update`, then `nook doctor`. Report: what the disk settled, what the owner decided, what you wrote, and every gap that doctor still lists. A pack gap that is left is not done: say why.

## With an argument
`/setup a new repo projects/billing`: do steps 2 to 8 for that change only. Add one area, change one check. Move nothing else.

## Gotchas
- Never ask what the disk answers: a `test` script in `package.json` is the test check.
- A folder that holds two desks that must stay apart (company and personal) gets no packs.
- The Nook block in `CLAUDE.md` is not yours. Write above or below it.
- A check that you did not run is a guess. Run each one once in its area, or mark it "not run".
- Do not write a secret value anywhere. The `secrets` list holds paths only.
