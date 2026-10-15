# Harness Kit, the repo

This repo builds the kit itself. Read `docs/harness-kit.md` for the plan and `docs/expect/` for what each step must do.

## Map
```
packages/shared/src/   the library of every tool: cli, errors, env (environments, packs), pack (manifests), hook
packs/<name>/          one Claude Code plugin each: pack.json, .claude-plugin/, bin/, src/, templates/, skills/, hooks/, test/
docs/                  the plan, the guide, the expectations
```
`packs/core` (tool `kit`) and `packs/engineering` (tool `kit-eng`, also `kit eng …`) exist in v0.1. The contract of engineering is `docs/engineering.md`.

## Checks
- `bun run check`: `tsc --noEmit` and `bun test`. Commit only when it passes.
- `packs/core/bin/kit ste <file.md>` on each Markdown file of `packs/` and `docs/` (not `docs/wiki/`): above 80%.
- `claude plugin validate .` after a change to a manifest.
- Try a change in a scratch folder: `kit init` there, then `kit doctor` and a hook call with JSON on stdin.

## Rules
- A pack imports `@kit/shared/*` only, never another pack. Packs talk through their tools: `--json` on stdout and the exit codes of `errors.ts`.
- The kit never names the owner's folders. Examples use `company/`, `personal/`, `shop`, `SHOP-12`.
- A guard hook blocks when it cannot decide. A helper hook (style, context) lets the call pass when it fails.
- `kit init` writes only what it marks: the kit block, `.claude/rules/kit/`, its settings keys, `.kit/`. Never a line of the owner.
- Write clear code: clear names, small functions, early returns. Comment only hard logic, in one or two lines.
- Test first with `bun test`. A test uses a temporary folder and never touches `~/.claude` or the owner's folders.
- Commit only when the owner asks. One commit for each part, with a message that says what changed and why.
