# Plan: web v2

> In short: the web app moves to the v2 look of the approved mock: calm color, pill buttons, a ring and a soft shadow on raised parts, glass on what floats, round corners. Home becomes an inbox where the owner acts in place, the board gets phases and a Display menu, and an item opens in a drawer and on a full page of rich documents.

The mock is the demo artifact `161XM1hA4Mm1Tw31tNza1D`. The compare of the kit is the artifact `GWGqJv4vj9YkE5wUEUANGt`. A row of this plan that does not match the mock is a defect of the plan.

## Why

- The owner reads the app to act: approve a plan, answer a question, accept the work. Today each action needs a dialog or the terminal.
- The board shows each step as a column, so the page scrolls sideways at 1440 px.
- The item dialog covers the board, and its documents read as plain text.
- The owner set a taste for v2: pill buttons, a ring and a soft shadow, glass on what floats, round corners, and the v1 diagram kit.

## What changes

| Part | Today | After |
|---|---|---|
| tokens | Bench v1 colors | v2 colors in OKLCH, ground `#f6f6f4`, dark theme |
| corners | Bench radii, superellipse | the v2 scale, a round arc |
| shell | dark rail of workspaces | workspace menu in the sidebar; the sidebar docks or floats |
| keys | none | ⌘K menu, G and a letter, J and K, `[` |
| home | a brief of the workspace | an inbox: act in place, number tiles, receipts |
| board | Bench board, one column for each step | counting lane, four phases, backlog frame, Display menu |
| item | 80% dialog | a drawer with the overview, a full page with tabs |
| documents | text blocks | parts of the kit for each section |
| points | none | story points on cards, columns and details |

## The look

The rules come from the owner. Each part takes one treatment by its role.

| Role | Parts | Look |
|---|---|---|
| ground | page, docked sidebar, board frames | flat, `#f6f6f4`, no shadow |
| raised | tiles, cards, active nav item | white, a 1px ring and a soft shadow |
| glass, regular | top bar when the page scrolls | frosted, a hairline under it |
| glass, thick | drawer, ⌘K, menus, toast, floating sidebar | frosted, a ring and a large shadow |
| highlight | the row or card that a key acts on | a blue tinted ring and shadow |

- The main button is ink. Color marks only a state: red blocks, amber waits, green done.
- Buttons and chips are pills of 30 px. Cards have a 12 px corner, tiles 16 px, panels 14 px.
- Every corner is a round arc. The superellipse is never used.
- With "reduce transparency" on, glass turns solid.

## The diagram kit

- Every diagram and chart comes from the Bench kit of v1, as today: the fences, the slice board, the lanes, the timeline and the charts.
- A token layer maps the colors, surfaces, shadows and fonts of the kit to v2. The shapes and the layout of the kit stay.
- The box roles of the kit read the v2 radius scale: a node 12 px, a frame 16 px.
- A state on a node shows in its kicker, such as `T1 · DONE`, on a node in the tone of the state. A node has no separate status badge.

## Home: the inbox

```
┌ Waits for you  3 ───────────────────────┐ ┌ Rework ┐ ┌ First  ┐
│ ● SHOP-43 Export the list   [Approve A] │ │ 25%  ~ │ │ 67%  ~ │
│ ● SHOP-42 Q2 blocks  [answer…] [Answer] │ └────────┘ └────────┘
│ ● SHOP-44 Send a mail        [Review]   │ ┌ Board ───────────────┐
└─────────────────────────────────────────┘ │ ▇▇▇▇▇▇▇ by step      │
┌ Receipts today ─────────────────────────┐ └──────────────────────┘
│ 09:42 backend-builder finished T2 proven│ ┌ The lead runs ───────┐
└─────────────────────────────────────────┘ └──────────────────────┘
```

- A row for each move that waits for the owner: an approve, an accept, a blocking question, a `/close`.
- Approve and accept run the owner move through the gate. A confirm step names the move first.
- A blocking question takes the answer in its row. The answer goes through `nook eng answer`.
- A number tile shows a metric, its count, and a trend line of the last six weeks.
- Receipts come from the event lines of the items: who, what changed, the proof.

## The board

- One lane counts the items of each phase: Shape, Build, Review, Done. Each part shows its count, its points, and the items that wait for the owner.
- The four phases are columns on a muted frame: Shape holds framing and planning, Build holds ready and cooking.
- The backlog is a frame under the phases.
- A Display menu picks the layout, board or list, and the grouping, phase or who holds it.
- The list folds by group. A row opens in place with the next move, the facts and two links.
- A card has the kind icon, the id, the points, the mode, the areas, the title, a bar of the seven steps, and one flag line.
- An empty column says what is empty, such as "No fix items in Done".

## The item

- A card opens a drawer of thick glass: the next move, the summary, the facts, the questions and guesses, the criteria, the receipts and the documents.
- The drawer has a link to the full page. An item at a gate keeps Send back and Approve in the drawer.
- The full page has tabs for the documents of its kind:

| Kind | Tabs |
|---|---|
| feature, chore | overview, spec, plan, tasks, walkthrough, activity |
| fix | overview, spec, root cause, plan, tasks, walkthrough, activity |
| investigate | overview, spec, plan, findings, activity |

- Each section of a document maps to a part of the kit. Example: each line of Acceptance criteria becomes a card with its tag, its source and its state.
- The state of a criterion comes from the slices that prove it. Before the build, it shows "planned".
- Out of scope shows a × on each line. Actual and Expected of a fix show side by side.
- The overview shows a ring of the criteria, a bar of the slices, the time in each step, the lanes and the receipts.

## Points

- The ledger keeps the points of an item. A pull of the tracker fills them when the tracker has a story point field.
- The size S, M or L stays in the spec. The page shows both, such as `L · 8 pt`.
- An item with no points shows no point chip.

## Plan diagrams

- A plan marks a new part and a changed part in its mermaid labels. Today the reader takes only `(new)` and `(changes)`.
- The plan template names one syntax: `(new)`, `(changed)`, `(error)`.
- The reader also takes `: new` and `: changed`, and removes the mark from the title. Example: "Reset button part: new" draws a new node with the title "Reset button part".

## Order

| # | Slice | Proof |
|---|---|---|
| V1 | kit tokens, the token layer of Bench, the radius scale, the dark theme | kit tests; a test that each mapped token exists in the kit |
| V2 | kit parts: button, chip, card, tile, segment, input, key hint, empty state, glass menu, drawer, toast | kit tests; a look at each part, light and dark |
| V3 | the shell: sidebar with the workspace menu, dock and float, top bar, ⌘K, the keys | web tests; a live test of ⌘K and `[` in Chrome |
| V4 | points in the ledger and the tracker pull | engineering and issue-tracker tests; migration test |
| V5 | the board: lane, phases, backlog, Display menu, list, cards | web tests; screenshots of each layout and grouping |
| V6 | the item: drawer, full page, tabs by kind, document parts, overview | web tests on the four demo items; screenshots of each tab |
| V7 | plan diagram marks: template and reader | fence tests with the owner's labels |
| V8 | the inbox: rows, act in place, number tiles, receipts | web tests; a live test that Approve asks before it runs |
| V9 | wiki, learn, metrics, agents, events, settings on v2 | web tests; screenshots |
| V10 | the reference, the guide, the report, the doc pages | `nook ste`; `bun run check`; `bun run e2e` |

## Out of scope

- "Later" on an inbox row: it needs a store for a snooze. A later item adds it.
- A move from ⌘K with no confirm. Each move asks first, as on the page.
- A change of the read rules of the documents. Only the parts that draw them change.
- A new diagram kit. Bench stays the kit.

## Risks

| Risk | Likelihood | What we do |
|---|---|---|
| a new Bench release renames a token that the layer maps | med | a test reads the token names of the kit and fails on a missing one |
| glass slows a long page | low | glass only on floating parts; a solid style for reduced transparency |
| an act in place skips the gate | low | each move goes through the gate and its confirm; a live test proves the confirm |
