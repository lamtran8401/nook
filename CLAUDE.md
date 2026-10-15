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
- Write clear code: clear names, small functions, early returns.
- Each edit of the kit code leaves `kit` runnable. The hooks run this code, so a broken kit blocks the guards of the session. Write a new function before the line that calls it, or write the whole file at once.

## Comments
- Comment only hard logic, in one or two lines: what and why.
- Never write history, a decision log or a "kept for" note in a comment. Git holds the history.
- Delete a comment that repeats the name or the code. Never leave code in a comment.
- When a comment grows long, find a better name or a smaller function.

## Tests
- Test first with `bun test`. A test uses a temporary folder and never touches `~/.claude` or the owner's folders.
- One test file for each unit under test (a class, a module, a command), next to its package: `packages/<name>/test/`.
- A test name states the behavior: `approve by the lead exits 5`. Never name a test or a group by a scenario id such as `E-13`.
- One behavior for each test. Assert a visible result: a return value, an exit code, printed text, a row, a file.
- A test must be able to fail. Write the expected value by hand; never compute it with the code under test. A test that asserts only a mock call, a constant, `toBeDefined` or `not.toThrow` proves nothing.
- Break the rule in the code once and see the test fail before you trust it.
- Never weaken, skip or comment out a test to make it pass. Change a test only when the behavior changed.
- Commit only when the owner asks. One commit for each part, with a message that says what changed and why.
