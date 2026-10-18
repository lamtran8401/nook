# The wiki pack

> In short: the wiki is `docs/wiki/` of a desk, in shelves, each shelf with one `INDEX.md`. Nook adds and checks the index lines; the skills read and write the pages after the owner's yes.

This file states how the code works now. The code is in `packages/wiki/`; the plugin is `plugins/wiki/`.
The home of the wiki is the nearest desk above a folder that turns `wiki` on.

## The section of nook.yml

```yaml
wiki:
  dir: docs/wiki                # the default
  references: docs/references   # the default
  archive: archive/wiki         # the default: where a merged page sends the old pages
  shelves:
    - { name: ideas, use: "An idea that has not started." }
    - { name: areas, use: "A responsibility with no end date." }
    - { name: resources, use: "Knowledge to look up." }
    - { name: daily, use: "One note for each day.", index: false }
```

- A shelf with `index: false` gets no index and no index line for its pages.
- `/setup` writes the section from the folders that exist and the owner's words.
- The setup of the pack makes the wiki folder, the references folder and a folder for each shelf.
- With no section, `nook doctor` shows the gap and the fix `/setup`.

## The indexes

| File | Rows |
|---|---|
| `docs/wiki/INDEX.md` | `\| Shelf \| Use \|`, one row for each shelf |
| `docs/wiki/<shelf>/INDEX.md` | `\| Page \| Type \| Summary \|`, one row for each page of the shelf |

- A row names its page as a link relative to the shelf.
- A new row takes its type from `type:` in the front matter of the page. Else the shelf gives it: `ideas` gives `idea`, `areas` gives `area`, `resources` gives `resource`.
- Its summary is the first sentence of the `> In short:` line, else of the first paragraph.
- Nook adds rows after the last row of the table. It never changes a row that exists, so the owner can edit any summary.
- Only `nook wiki retire` takes a row out.

## Drafts

A draft waits in `docs/wiki/drafts/` for the owner's yes, such as `drafts/resources/<page>.md`.
A draft is not a page: no index names it, and the link check does not read it. `nook brief` shows each draft as a line that waits for the owner.

## Commands

| Command | What it does |
|---|---|
| `nook wiki index` | each gap of the indexes, with its fix; exit 1 with a gap |
| `nook wiki index --fix` | makes each missing index and adds a row for each page with none |
| `nook wiki links` | each broken link; exit 1 with one |
| `nook wiki shelves` | the shelves and the use of each |
| `nook wiki retire <page...> --into <page> [--date YYYY-MM-DD]` | moves the old pages of a merge to the archive |

The gaps of `nook wiki index`:
- a missing `docs/wiki/INDEX.md`, or no row in it for a shelf;
- a missing `INDEX.md` of a shelf;
- a page with no row;
- a row that names a page that does not exist. The fix is to restore the page or remove the row.

`nook wiki links` finds each `[[name]]` with no page of that name, and each relative Markdown link to a file that does not exist.

`nook wiki retire` runs after the merged page exists:
- It moves each old page to `<archive>/<date>/<page>`. The date is today, or `--date`.
- It takes the row of each old page out of the index of its shelf.
- It points each link to an old page at the merged page.
- It refuses when the merged page or an old page does not exist.

`nook doctor` lists the gaps of the indexes under the wiki pack.

## Read paths

`packages/wiki/src/read.ts` gives the web app two reads, and writes nothing:

- `readWiki(desk)`: each shelf with its use and the lines of its index, and the drafts that wait for a yes.
- `readPage(desk, path)`: the text of one page or draft, and each link with the page that it reaches, or null for a broken link. A path outside the wiki, a file that is not Markdown, a missing file, a folder and a secret file are refused. The check runs on the real path, so a page that is a link to a file outside the wiki is refused too.

`nook wiki links` and `readPage` read the links with the same code.

## Skills and agent

| Name | Who starts it | What it does |
|---|---|---|
| `/wiki-ask` | the owner or the model | see below |
| `/wiki-add` | the owner | see below |
| `/wiki-tidy` | the owner | see below |
| `/wiki-merge` | the owner | see below |
| `librarian` | a skill or the lead | reads the wiki for another agent and reports the facts with their pages, in 30 lines at most |

- `/wiki-ask`: it reads the index first, then the pages whose line matches. It answers in a few lines with a link to each page.
- `/wiki-add`: it writes a reference note in `docs/references/<date>-<slug>.md`, in its own words, and drafts a page in `resources/`. It writes the page after the owner's yes; "later" keeps a draft.
- `/wiki-tidy`: it runs the two checks and looks for two pages on one topic, a page with no source, and an adjective with no example. It fixes the mechanical part after one yes.
- `/wiki-merge`: it merges related pages, such as the features of one epic, into one page. After the yes, `nook wiki retire` moves the old pages.

Other packs use the wiki:
- `/spec` of engineering reads the index and names each page that it uses, as `(wiki: resources/shipments-api.md)`.
- `/close` drafts one change for each `ADD` or `CHANGE` criterion on the page of its topic in `resources/`. It writes the changes that the owner accepts.
- `/study` of learn writes a concept page into the wiki.

## The rules and the settings

- `templates/rules/wiki.md` goes to `.claude/rules/nook/wiki.md` with `nook init`.
- The rules: read the index first, name each page that you use, write a page only after the owner's yes, never write the shelf `areas/`.
- `templates/settings.json` allows `Bash(nook wiki *)`.
