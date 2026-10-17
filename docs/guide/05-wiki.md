# 5. The wiki

> In short: the wiki is `docs/wiki/` of your desk. It holds what lasts: how a system works, the lesson of a source, a concept. You and the agents read it; a page changes only after your yes.

## The shelves

```
docs/wiki/
├── INDEX.md          one row for each shelf
├── ideas/            an idea that has not started
├── areas/            a responsibility of yours; you write it, agents only read it
├── resources/        how a system works, the lesson of a source, a concept
├── daily/            one note for each day, no index
└── drafts/           pages that wait for your yes
docs/references/      a note on each source, in the words of the companion
```

Each shelf with an index has an `INDEX.md` with one row for each page: `| Page | Type | Summary |`. An agent reads the index first, and opens a page only when its row matches the task. So the wiki stays cheap to read when it grows.

`/setup` writes the shelves into `nook.yml`. You can name other shelves; a shelf of dated notes gets `index: false`.

## What a good page holds

- How a thing is now, with its source.
- A real example for each point. "The retry is fast" is not a point; "The retry waits 2, 4, then 8 seconds" is.
- The pitfalls that remain.
- One History line for each change, such as `2026-10-17: SHOP-12`. Never the story of the work.

## Keep a source

Type `/wiki-add` with a link, a file or the text:

```
/wiki-add https://example.com/how-payment-retries-work
```

1. The companion writes a reference note in `docs/references/<date>-<slug>.md`: the link, the title, the date and the main points in its own words. It never copies the source.
2. It drafts a page in `resources/`: the main points, an example for each, the gotchas, the source.
3. You say yes, later or no. Yes writes the page and its index row. Later keeps the draft in `docs/wiki/drafts/`, and `/brief` shows it until you decide.

## Ask the wiki

Type `/wiki-ask <question>`, such as `/wiki-ask how does the shipments api page its results?`. The answer comes in a few lines, with a link to each page, as `(wiki: resources/shipments-api.md)`.

A fact with no page link is a guess. The companion says so.

## Keep the wiki clean

| You type | It does |
|---|---|
| `/wiki-tidy` | finds broken links, pages with no row, rows with no page, two pages on one topic, pages with no source, adjectives with no example; fixes the mechanical part after one yes |
| `/wiki-merge <topic>` | merges related pages into one page, such as the features of one epic into one flow; the old pages go to `archive/wiki/<date>/` after your yes |

The commands under them:

```
nook wiki index          each gap of the indexes, with its fix
nook wiki index --fix    adds each missing index and row
nook wiki links          each broken link
nook wiki shelves        the shelves and the use of each
```

## How other packs use the wiki

| Pack | Skill | Use |
|---|---|---|
| engineering | `/spec` | reads the index and names each page that the spec uses |
| engineering | `/close` | drafts one page change for each `ADD` or `CHANGE` criterion |
| learn | `/study` | writes a concept page after your yes |

The full contract is in [the wiki reference](../reference/wiki.md).
