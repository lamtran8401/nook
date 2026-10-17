# The wiki pack

> In short: the wiki is `docs/wiki/` of an environment, in shelves, each shelf with one `INDEX.md`. Nook adds and checks the index lines; the skills read and write the pages after the owner's yes.

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

A shelf with `index: false` gets no index line for its pages. `/setup` writes the section from the folders that exist and the owner's words.

## The indexes

| File | Rows |
|---|---|
| `docs/wiki/INDEX.md` | `| Shelf | Use |`, one row for each shelf |
| `docs/wiki/<shelf>/INDEX.md` | `| Page | Type | Summary |`, one row for each page of the shelf, the page as a link relative to the shelf |

A new row takes its type from `type:` in the front matter of the page, else from the shelf (`ideas` gives `idea`, `areas` gives `area`, `resources` gives `resource`). Its summary is the first sentence of the `> In short:` line, else of the first paragraph.
Nook adds rows after the last row of the table. It never removes a row and never changes a row that exists, so the owner can edit any summary.

## Commands

| Command | What it does |
|---|---|
| `nook wiki index` | each gap of the indexes, with its fix; exit 1 with a gap |
| `nook wiki index --fix` | makes each missing index and adds a row for each page with none; removes nothing |
| `nook wiki links` | each `[[name]]` with no page of that name, and each relative Markdown link to a file that does not exist |
| `nook wiki shelves` | the shelves and the use of each |
| `nook wiki retire <page...> --into <page> [--date YYYY-MM-DD]` | after a merged page: moves the old pages to a folder of that date in the archive folder (the `archive` key, `archive/wiki` by default), takes their rows out of the index, points each link at the merged page |

`nook doctor` lists the gaps of the indexes under the wiki pack.

## Skills and agent

| Name | Who starts it | What it does |
|---|---|---|
| `/wiki-ask` | the owner or a skill | the index first, then the pages whose line matches; an answer with a link to each page |
| `/wiki-add` | the owner | the source into `docs/references/`, a draft page in `resources/`, written after the owner's yes; a draft kept for later waits in `docs/wiki/drafts/`, and `/brief` shows it |
| `/wiki-tidy` | the owner | broken links, index gaps, two pages on one topic, no source, adjectives with no example |
| `/wiki-merge` | the owner | related pages, such as the features of one epic, into one complete page; the old pages go to the archive |
| `librarian` | a skill | reads the wiki for another agent, the index first, and reports the facts with their pages |

`/spec` reads the index and names each page it uses. `/close` drafts one change for each `ADD` or `CHANGE` criterion on the page of its topic in `resources/`, and writes the ones that the owner accepts.
