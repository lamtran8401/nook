# Harness Kit, the repo

This repo builds the kit itself. Read `docs/harness-kit.md` for the plan and `docs/expect/` for what each step must do.

## Map
```
apps/kit/              the one binary `kit`: it joins the commands of each package and runs them. No logic.
packages/shared/       the CLI router, the exit codes, the hook input and output
packages/env/          environments, kit.yml, the pack manifests, the plugin folders
packages/core/         init, doctor, the writing check, the core hooks
packages/engineering/  the ledger, the item machine, the guards, the permissions, the documents, git, the engineering hooks
plugins/<pack>/        one Claude Code plugin each: pack.json, .claude-plugin/, bin/kit (a shim), hooks/, skills/, agents/, templates/. No code.
docs/                  the plan, the guide, the contract of engineering (`engineering.md`), the expectations
```
v0.1 has the packs core and engineering. `kit eng …` runs the commands of engineering.

## Checks
- `bun run check`: `tsc --noEmit` and `bun test`. Commit only when it passes.
- `apps/kit/bin/kit ste <file.md>` on each Markdown file of `plugins/` and `docs/`: above 80%.
- `claude plugin validate .` after a change to a manifest.
- Try a change in a scratch folder: `kit init` there, then `kit doctor` and a hook call with JSON on stdin.

## Rules
- `apps/kit` imports the packages. A package imports `@kit/shared/*` and `@kit/env/*` only, never another pack package. A plugin holds no code: its hooks call `bin/kit`, which runs the binary.
- One job for each module. A class where state and its rules live together (the ledger, an item, a guard); a plain function for the rest. Branch on a union with `ts-pattern` and `.exhaustive()`.
- The kit never names the owner's folders. Examples use `company/`, `personal/`, `shop`, `SHOP-12`.
- A guard hook blocks when it cannot decide. A helper hook (style, context) lets the call pass when it fails.
- `kit init` writes only what it marks: the kit block, `.claude/rules/kit/`, its settings keys, `.kit/`. Never a line of the owner.
- Write clear code: clear names, small functions, early returns. Comment only hard logic, in one or two lines.
- Test first with `bun test`. A test uses a temporary folder and never touches `~/.claude` or the owner's folders.
- Commit only when the owner asks. One commit for each part, with a message that says what changed and why.
