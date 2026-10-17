# Expectation: the product docs

> In short: the docs of Nook are one guide book, one reference for each pack, and one report of the current build. Each file states how Nook works now. No file tells the story of the work.

## The files

| File | For | Holds |
|---|---|---|
| `README.md` | a new reader | what Nook is, the install, the one idea, where to read next |
| `docs/guide/` | the owner who uses Nook | the guide book, one chapter for each task |
| `docs/reference/` | the owner and the agents | the contract of each pack: core, engineering, wiki, learn |
| `docs/report.md` | the owner | the current build: the parts, the numbers, the limits, the next steps |
| `docs/expect/` | the builder | what the current step must do before it is done |

Two pages show the same content: the guide book and the build report. Each page is an artifact in the Bench design system, built from these files.

## What goes

| File | Why |
|---|---|
| `docs/nook.md` | The guide, the reference of core and the report hold its content. |
| `docs/engineering.md`, `docs/wiki.md` | They move into `docs/reference/`. |
| `docs/expect/desk-cleanup.md` | The step is done. This file is the one expectation. |

## Scenarios

| # | Given | When | Then |
|---|---|---|---|
| 1 | a new reader | the reader follows chapter 1 of the guide | the folder is a desk, and `nook doctor` shows no gap |
| 2 | each command of `nook --help` | a reader looks for it | the reference of its pack names it |
| 3 | each skill and agent of the four plugins | a reader looks for it | the guide or the reference names it, with its use |
| 4 | each Markdown file of `docs/` and `README.md` | `nook ste` scores it | the score is above 80% |
| 5 | each relative link in `docs/` and `README.md` | a reader opens it | the file exists |
| 6 | each number in the report | a reader runs the command next to it | the command prints the same number |
| 7 | a code comment that names a doc section | a reader opens the doc | the section exists at the new path |
| 8 | any doc file | a reader reads it | it has no history, no event log and no old name of the tool |
| 9 | the two pages | the owner opens each one | it shows the content of its Markdown source, with diagrams, at 1440 and 390 pixels |

The step is done when each scenario passes and `bun run check` passes.
