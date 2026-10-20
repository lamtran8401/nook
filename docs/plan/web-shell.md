# Plan: the shell of the web app

> In short: the web app gets the shell of a modern work app: a dark rail with one icon for each desk, a sidebar of pages, a header on each page, and cards with a colored icon tile. One `nook web` serves every desk of the owner. Its terminal prints the log of Next.js: the banner, then one line for each request.

## Why

- The owner's example is a work app with a rail, a sidebar and cards. Today the web app has a top bar of tabs, plain rows and few colors.
- One `nook web` shows one desk. The owner works in two desks, `personal` and `chorus`, and runs a second app for the second desk.
- The terminal of `nook web` prints only lines of Nook. The owner expects the banner of Next.js and a line for each request.

## What changes

| Part | Today | After |
|---|---|---|
| shell | a top bar with tabs and a search box | a dark rail of desks, a sidebar of pages, the search box at the top of the sidebar |
| desks | one desk for each `nook web` | each desk of the desk list at its own path, such as `/personal/works` and `/chorus/works` |
| page | a title in some pages | a header on each page: the title and one line on its use; sections with a count and the filters on the right |
| cards | the cards of the board; rows elsewhere | one card style: a pastel icon tile with a colored glyph, a bold title, two muted lines, tag pills; for items, agents, skills, shelves and courses |
| colors | the tones of the states | a color for each kind: feature blue, fix red, investigate violet, chore aqua; the state keeps its tone |
| pages | Home, Works, Wiki, Learn, Search | Home, Works, Wiki, Learn, Metrics, Agents and skills, Events, Settings |
| log | `nook web: listening on 127.0.0.1:<port>` | the banner of Next.js, `✓ Ready in <n>ms`, then `GET /personal/works 200 in 12ms` |

## The shell

```
┌────┬──────────────┬──────────────────────────────────────────────┐
│ N  │ Search…      │ Works                                         │
│────│ Home         │ The items of personal, in the order of flow.  │
│ pe │ Works      6 │                                               │
│ ch │ Wiki         │ Items  6                   ⌕  Kind: All ▾     │
│    │ Learn        │ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│    │ Metrics      │ │ ◆ SHOP-42│ │ ● SHOP-43│ │ ◇ SHOP-44│        │
│    │ Agents       │ │ Pay with │ │ Export   │ │ Mail on  │        │
│    │ Events       │ │ a card   │ │ the list │ │ shipping │        │
│    │              │ │ api web M│ │ api  S   │ │ worker S │        │
│ +  │ Settings     │ └──────────┘ └──────────┘ └──────────┘        │
└────┴──────────────┴──────────────────────────────────────────────┘
```

- The rail shows one icon for each desk: the first two letters of its folder name on a tile of its own color. The icon of the open desk has a ring. A desk that is gone from the disk drops off.
- The sidebar shows the pages of the packs that are on in the desk. Wiki shows only with the pack wiki, Learn only with the pack learn. A count shows next to Works: the open items.
- On a page narrower than 900 px, the rail and the sidebar fold into a menu button.
- The density follows the owner: the style of the example with smaller gaps. A card has 16 px of padding, a grid has 12 px of gap.

## The new pages

| Page | What it shows |
|---|---|
| Metrics | each metric of `nook eng metrics` for the last 30 days, the root causes as a bar list, and the guard blocks of `nook retro` |
| Agents and skills | a card for each agent and each skill of the packs that are on: its name, its job in one line, its pack as a tag |
| Events | the event log of the desk, newest first: the blocks, the errors, the prompts; a filter by kind and by day |
| Settings | the packs of the desk, its areas with their checks, the kinds that the desk learned, the root cause types, the path of `nook.yml` |

Each page reads the desk through the read paths of the packages, as today. No page writes, except the owner moves that pass the gate.

## The desks

- The server reads the desk list of the owner (`~/.config/nook/desks`) at each request, and adds the desk where `nook web` started.
- The path of a desk is its folder name, such as `/personal`. Two desks with one name get a number: `/shop`, `/shop-2`.
- `/` sends the browser to the desk where `nook web` started.
- The pairs stay in `.nook/` of the desk where `nook web` started. One pair lets the owner move items in each desk of the list.
- The live refresh watches the folder of the desk on the page only.

## The log

```
   ▲ Next.js 16.3.8
   - Local:   http://127.0.0.1:4321
   - Desks:   personal, chorus

 ✓ Ready in 412ms
 GET /personal/works 200 in 12ms
 POST /personal/works/SHOP-43 303 in 48ms
```

- The server writes the banner and the request lines in the format of Next.js, with the colors of a terminal when the output is one.
- A request line names the method, the path, the status and the time. The query string is left out, so a pair token never shows.
- The lines of Nook that stay: the build, a port that moved, a refusal, an error with its stack.

## Order

| # | Slice | Proof |
|---|---|---|
| W1 | the log of Next.js | a test of the banner and of a request line, with and without colors; no token in a line |
| W2 | the kit: rail, sidebar, page header, section header, icon card, the kind colors | the kit tests; a look at each part |
| W3 | the desks at their paths, and the shell in the layout | handler tests for each path; `/` sends to the first desk; the gate holds for each desk |
| W4 | the pages of today on the shell and the cards | the web tests; a screenshot of each view at 1440 px and 390 px |
| W5 | Metrics, Agents and skills, Events, Settings | a test for each read path and each page; screenshots |
| W6 | the reference of core, the guide, the report | `nook ste`; `bun run check`; `bun run e2e` |

## Out of scope

- A dark theme of the whole app. The rail is dark; the pages stay light.
- A change of the board of Works. It keeps a column for each state, now with the new cards.
- Integration logos on the cards. Nook has no integrations to show; a pack shows as a tag.
- A write from a new page.

## Risks

| Risk | What stops it |
|---|---|
| a page reads a desk that is not on the list | the server answers only the paths of the desk list and the start desk; any other path is 404 |
| a long desk list slows each request | the server reads the list file only; a desk opens only when its page asks |
| the new density hides text | a screenshot of each view at both widths before the step is done |
