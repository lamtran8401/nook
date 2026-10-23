# Expect: web v2

The plan is `docs/plan/web-v2.md`. Each row must pass before its slice is done.

## Part 1: the kit

| # | Given | When | Then |
|---|---|---|---|
| E1 | the light theme | a page shows | the ground is `#f6f6f4`, cards are white with a 1px ring and a soft shadow |
| E2 | the system is dark | a page shows | every part takes the dark tokens; no text reads dark on dark |
| E3 | a button, a chip, a segment | it shows | each is a pill; the main button is ink |
| E4 | a card, a tile, a drawer | it shows | the corners are 12 px, 16 px and 14 px, each a round arc |
| E5 | a Bench diagram | it draws | its colors and corners follow v2; its layout is the layout of v1 |
| E6 | a token that the layer maps | the kit has no such token | a test fails and names the token |
| E7 | "reduce transparency" is on | a menu opens | the menu is solid, with no glass |

## Part 2: the shell and the keys

| # | Given | When | Then |
|---|---|---|---|
| E8 | a workspace list with two workspaces | the owner opens the workspace menu | each workspace shows with its open count; the open workspace has a check |
| E9 | the docked sidebar | the owner presses `[` | the sidebar hides; it floats over the page when the pointer reaches the left edge |
| E10 | a page of 390 px | it shows | the sidebar floats; no line runs off the page |
| E11 | any page | the owner presses ⌘K | the menu lists the moves that wait first, then items, pages and workspaces |
| E12 | the ⌘K menu | the owner runs Approve | the confirm step shows first; Cancel runs nothing |
| E13 | any page | the owner presses G, then B | the board opens |

## Part 3: the inbox

| # | Given | When | Then |
|---|---|---|---|
| E14 | an item at the approve gate | home shows | a row names the item and the move, with Review and Approve |
| E15 | that row | the owner clicks Approve | a confirm names the move; Yes runs `/gate approve` through the gate |
| E16 | a blocking question | home shows | the row takes the answer; Answer records it with `nook eng answer` |
| E17 | the inbox at rest | it shows | no row has the highlight |
| E18 | the inbox | the owner presses J, or clicks a row | that row takes the highlight; A acts on it |
| E19 | six weeks of items | home shows | each number tile has its count and a trend line of six points |

## Part 4: the board

| # | Given | When | Then |
|---|---|---|---|
| E20 | items in every step | the board shows | four phase columns fit 1440 px with no sideways scroll |
| E21 | the board | it shows | one lane counts each phase, with its points and its waits |
| E22 | the Display menu | the owner picks List and Who holds it | the list shows one group for each holder |
| E23 | the list | the owner clicks a row | the row opens in place with the next move and two links |
| E24 | a kind filter that hides a column | the board shows | the column says "No fix items in Done" |
| E25 | an item with 8 points | its card shows | the card shows `8 pt`; its column total counts it |

## Part 5: the item

| # | Given | When | Then |
|---|---|---|---|
| E26 | a card | the owner clicks it | a drawer opens with the overview; the card keeps the highlight |
| E27 | a fix | its page shows | the tabs are overview, spec, root cause, plan, tasks, walkthrough, activity |
| E28 | an investigation | its page shows | the tabs are overview, spec, plan, findings, activity |
| E29 | a spec with three criteria | the spec tab shows | three cards, each with its tag, its source and its state |
| E30 | an item at planning | the spec tab shows | each criterion shows "planned" |
| E31 | slices with states | the lanes draw | each node names its state in its kicker on a tinted node |
| E32 | a plan label "Reset button part: new" | the plan tab draws | the node is new, with the title "Reset button part" |
| E33 | Out of scope | it shows | each line has a × |

## Part 6: the docs

- The reference of core and of engineering states the inbox, the board, the drawer, the keys and points.
- The guide shows the inbox and the board with a screenshot of each.
- Each Markdown file passes `nook ste`.
