# Expect: the shell of the web app

The plan is `docs/plan/web-shell.md`. Each row must pass before the step is done.

## Part 1: the log

| # | Given | When | Then |
|---|---|---|---|
| S1 | `nook web` starts | the server is ready | the terminal shows the banner of Next.js with its version, the local address and the names of the desks, then `✓ Ready in <n>ms` |
| S2 | the server answers a request | the response ends | the terminal shows one line: the method, the path, the status and the time, such as `GET /personal/works 200 in 12ms` |
| S3 | a request with a pair token in its query | the line is written | the line holds the path with no query string |
| S4 | an output that is no terminal | a line is written | the line has no color codes |

## Part 2: the shell

| # | Given | When | Then |
|---|---|---|---|
| S5 | a desk list with `personal` and `chorus` | the owner opens any page | the rail shows one icon for each desk, and the icon of the open desk has a ring |
| S6 | a desk with the packs engineering and wiki | the page shows | the sidebar names Home, Works, Wiki, Metrics, Agents and skills, Events and Settings; Learn is not there |
| S7 | a desk with open items | the page shows | the sidebar shows their count next to Works |
| S8 | a page of 390 px | it shows | the rail and the sidebar fold into a menu button; no line runs off the page |

## Part 3: the desks

| # | Given | When | Then |
|---|---|---|---|
| S9 | `nook web` started in `personal` | the owner opens `/` | the browser goes to `/personal` |
| S10 | the desk list has `chorus` | the owner opens `/chorus/works` | the board of chorus shows |
| S11 | a path that names no desk of the list | the owner opens it | the answer is 404 |
| S12 | a paired browser | the owner approves an item of chorus | the move runs in chorus; the pair is the one of the start desk |
| S13 | two desks with one folder name | the shell shows | their paths are `/shop` and `/shop-2` |

## Part 4: the cards and the pages

| # | Given | When | Then |
|---|---|---|---|
| S14 | an item of each kind | the board shows | each card has an icon tile in the color of its kind: feature blue, fix red, investigate violet, chore aqua |
| S15 | a desk with metrics | the owner opens Metrics | each metric of `nook eng metrics` shows, with the root causes as a bar list |
| S16 | the packs on in the desk | the owner opens Agents and skills | a card for each agent and skill, with its job and its pack |
| S17 | an event log | the owner opens Events | the events show newest first, with a filter by kind |
| S18 | a desk | the owner opens Settings | its packs, areas, learned kinds and root cause types show |

## Part 5: the docs

- The reference of core states the shell, the paths of the desks, the new pages and the log.
- The guide shows the web app with a screenshot of Works and of Metrics.
- Each Markdown file passes `nook ste`.
