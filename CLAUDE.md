# Nook, the repo

This repo builds Nook itself. Read `docs/report.md` for the current build, `docs/reference/` for the contract of each pack, and `docs/expect/` for what the current step must do.

## Map
```
apps/nook/             the one binary `nook`: it joins the commands of each package and runs them. No logic.
apps/web/              the web app of `nook web`: Next.js on Node; its pages call the read paths of the packages.
packages/shared/       the CLI router, the exit codes, the hook input and output, the names of the tool, the SQLite file, the command runner
packages/desk/         desks, nook.yml, the desk list of the owner, the pack manifests, the plugin folders, the UI kit
packages/core/         init, doctor, packs, where, the writing check, brief, retro, the core hooks
packages/engineering/  the ledger, the item machine, the guards, the permissions, the documents, git, the engineering hooks, the read paths of the web app
packages/wiki/         the shelves of the wiki, their indexes, the link check
packages/learn/        the courses: roadmap, cards, mistakes, scores, the study log
packages/ui/           the UI base of the web app: the shadcn/ui parts, cn(), and the Tailwind theme from the Bench tokens
plugins/<pack>/        one Claude Code plugin each: pack.json, .claude-plugin/, bin/nook (a shim), hooks/, skills/, agents/, templates/. No code.
docs/guide/            the guide book: how to use Nook, one chapter for each task
docs/reference/        the contract of each pack: core, engineering, wiki, learn
docs/report.md         the current build: the parts, the numbers, the limits, the next steps
docs/expect/           what the current step must do before it is done
scripts/pages/         builds the two pages of the docs (guide book, build report) from the Markdown
```
The packs are core, engineering, wiki and learn. `nook eng …` runs the commands of engineering, `nook wiki …` those of the wiki, `nook learn …` those of learn.
A desk is a folder with `nook.yml`. Desks nest: `company/` is a top desk, and `company/shop/` is a child desk inside it.

## Checks
- A change to a command, a skill, an agent or a hook changes its doc in the same commit: the reference of its pack, the guide when the use changes, the numbers of `docs/report.md`.
- After a change to `docs/guide/` or `docs/report.md`, run `bun run pages <out dir> <report url>` and publish both pages again to their links.
- Five diagrams of the pages are drawn by hand in `scripts/pages/build.ts`. When the doc text of one changes, `bun run pages` and its test stop and name the diagram: redraw it, then set its new fingerprint in `DRAWN`.
- `bun run check`: `tsc --noEmit` for the repo and for `apps/web`, and `bun test` on `packages` and `scripts`. Commit only when it passes.
- `bun run demo <dir>` builds a desk with mock work items for a look at the web app.
- `bun run e2e` builds the web app under Node and checks its pages. It also draws each Bench diagram of the catalog and the docs in headless Chrome and checks its layout. It takes about a minute, so it stays out of `bun run check`. Run it after a change to `apps/web` or to a read path.
- `nook ste <file.md>` on each Markdown file of `plugins/` and `docs/`: above 80%. Run the tool by its name; the guard blocks a path to the binary.
- `claude plugin validate .` after a change to a manifest.
- Try a change in a scratch folder: `nook init` there, then `nook doctor` and a hook call with JSON on stdin.

## Rules
- `apps/nook` imports the packages. A package imports `@nook/shared/*` and `@nook/desk/*` only, never another pack package. A plugin holds no code: its hooks call `bin/nook`, which runs the binary.
- One job for each module. A class where state and its rules live together (the ledger, an item, a guard); a plain function for the rest. Branch on a union with `ts-pattern` and `.exhaustive()`.
- Nook never names the owner's folders. Examples use `company/`, `personal/`, `shop`, `SHOP-12`.
- A guard hook blocks when it cannot decide. A helper hook (style, context) lets the call pass when it fails.
- An agent runs the tool as `nook` only; the guard blocks the short form `nk`. The names live in `packages/shared/src/names.ts`.
- `nook init` writes only what it marks: the Nook block, `.claude/rules/nook/`, `.claude/output-styles/nook-companion.md`, its settings keys, `.nook/`, and the folders of each pack. Never a line of the owner.
- `apps/web` imports its own files through the alias `@/`, such as `@/components/Board.tsx`, and the UI base as `@nook/ui/components/button.tsx`. Node runs `server.ts`, `lib/handler.ts`, `lib/gate.ts` and `e2e/render.ts` with no bundler and reads no alias, so those files use relative imports.
- `packages/ui` is the source UI kit: the shadcn primitives and the parts of Nook on them, and the Tailwind theme; it imports no other `@nook` package. `apps/web` composes the kit with Tailwind classes and has no CSS file of its own. A part that a page needs goes into the kit first.
- Name each file of `packages/ui` and `apps/web` in kebab-case, such as `record-list.tsx`. Add a part from `packages/ui` with `bunx --bun shadcn@<version> add <part>`, then check its imports and `package.json`: the CLI once pulled an unrelated npm package.
- Write clear code: clear names, small functions, early returns.
- Each edit of the Nook code leaves `nook` runnable. The hooks run this code, so a broken `nook` binary blocks the guards of the session. Write a new function before the line that calls it, or write the whole file at once.

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

## Git
- Work in a worktree branch, never on `main`. Commit each part there once `bun run check` passes; the owner merges it. Never merge and never push.
- One commit for each part, with a message that says what changed and why.
