# Bench diagrams

The Bench bundle draws a diagram from a JSON spec. The renderer is in `bundle.js`, and its styles are at the end of `bundle.css`. Both come from the Kit Diagram Catalog v30.

## Use

1. Load the page with the Bench tokens, `bundle.css` and `bundle.js`. Nook makes the tokens from `tokens.json`.
2. Put a spec in a `<script type="application/json">` inside an element with `data-bn-diagram`.

```html
<div data-bn-diagram>
  <script type="application/json">
    { "type": "mind", "root": { "t": "Nook", "c": [{ "t": "core" }, { "t": "wiki" }] } }
  </script>
</div>
```

The bundle mounts each diagram when the page loads. A diagram draws when its element has a width. It draws again when the width changes and when the fonts load. A `dg:restyle` event on `window` draws all diagrams again.

## API

| Call | Result |
|---|---|
| `Bench.diagram.render(el, spec)` | Draws one diagram of `spec.type` into `el`. |
| `Bench.diagram.mount(root)` | Draws each `[data-bn-diagram]` in `root`. |
| `Bench.init(root)` | Adds the behaviour of the components, then mounts the diagrams of `root`. |

- `render` clears `el` and adds the class `dg`. A second call on the same element replaces the first diagram.
- `render` throws an error when the type or the chart kind is unknown.
- `mount` takes `document` when `root` is empty. It skips an element that it drew before.
- When a spec fails, `mount` writes the error in the element and in the console. The other diagrams still draw.
- `window.BenchDiagrams` is the same object as `Bench.diagram`.

## Frame

A diagram sits in a raised card: the surface colour, a 1px ring and a soft shadow. The labels on its edges sit on the same colour. Set `"frame": false` in the spec for a diagram with no card.

## Open large

A button in the top right corner opens a block large, in a dialog over the page. The dialog has two modes.

| Mode | Use | In the dialog |
|---|---|---|
| `zoom` | a drawn diagram | Hand mode first, zoom, pan, Fit |
| `view` | HTML: a table, code, a log, a board | normal scroll, the text can be chosen |

A `graph`, `sequence`, `mind` or `links` diagram gets the `zoom` button. A board, a tree, a timeline and a chart scroll on their own and get no button. Set `"expand"` in the spec to change this: `"zoom"`, `"view"`, `true` (the default mode) or `false`.

Any other element gets the button with the attribute `data-bn-expand`. Its value is `view` (the default) or `zoom`. `data-bn-expand-title` gives the title of the dialog. With no title, the dialog uses the caption of the figure or the `aria-label`. From a script, call `Bench.expand(el, 'view')`.

```html
<div class="bn-table-wrap" data-bn-expand data-bn-expand-title="Decisions"><table class="bn-table">…</table></div>
```

The button shows when the pointer is on the block, and always on a touch screen.

| In the `zoom` dialog | Action |
|---|---|
| Hand mode, `H`, or hold `Space` | A drag moves the view. The text is not chosen. |
| Select mode, `V` | Choose and copy the text. |
| The wheel, or a pinch | Zoom at the pointer, by 10% or less for each step |
| `+`, `-`, or the buttons | Zoom at the middle |
| `0`, Fit, or a double click in Hand mode | Fit the diagram in the dialog |
| `Escape`, ✕, or a click outside the dialog | Close the dialog |

A diagram does not shrink to fit a column. It takes the width it needs, and its box scrolls. The dialog shows all of it.

## Scrollbars

The bundle hides the native scrollbar of each diagram box, each board column and each element with `data-bn-scroll`. It draws a thin bar over the box instead. The bar shows while the box scrolls or while the pointer is on it, and it fades after one second. A drag on the bar scrolls the box. `Bench.scrollbars(root)` adds the bar to the boxes of `root` that a page adds later.

## Shared values

| Value | Allowed |
|---|---|
| `tone` | `primary`, `success`, `warning`, `danger`, `violet`, `aqua`, `neutral` |
| `icon` | A name from the icon list below |

Icons: `user`, `users`, `globe`, `phone`, `monitor`, `server`, `database`, `zap`, `queue`, `cog`, `lock`, `shield`, `cloud`, `box`, `file`, `folder`, `git`, `bot`, `terminal`, `plug`, `book`, `layers`, `check`, `x`, `clock`, `alert`, `message`, `chart`, `card`, `flag`, `star`, `link`, `pen`, `split`, `bucket`, `grad`, `target`, `play`, `hook`, `help`, `stop`, `search`, `archive`, `chevron`.

A label that does not fit ends in an ellipsis. The tooltip shows the full label. An element with `data-tip` also shows a tooltip.

## graph

A graph puts nodes in a grid and draws the edges between them. Use it for a flowchart, a system design, a data model, an ERD and a tree of levels.

| Field | Default | Meaning |
|---|---|---|
| `type` | required | `"graph"` |
| `cols` | required | A number of columns, or a CSS `grid-template-columns` value. |
| `nodes` | required | The boxes. |
| `edges` | `[]` | The lines between the boxes. |
| `groups` | `[]` | The dashed frames around a part of the grid. |
| `colGap` | `56` | The gap between columns, in px. The renderer multiplies it by 1.4. |
| `rowGap` | `48` | The gap between rows, in px. The renderer multiplies it by 1.4. |
| `rows` | none | A CSS `grid-template-rows` value. |
| `pad` | `24px 18px` | The padding of the canvas. A group sets its own padding. |
| `justify` | `center` | The horizontal place of each node in its cell. |
| `route` | `curve` | The route of each edge: `curve` or `elbow`. |

A column is wide enough for each edge label on it.

### Node

| Field | Default | Meaning |
|---|---|---|
| `id` | required | The name that the edges use. |
| `at` | required | `[row, column]`, from 1. |
| `span` | `[1, 1]` | `[rows, columns]` that the node covers. |
| `title` | none | The main text. |
| `kicker` | none | A small label in capitals above the title. |
| `meta` | none | A muted line under the title. |
| `icon` | none | An icon in a tile on the left. |
| `tags` | none | A list of small chips under the text. |
| `status` | none | A chip: `done`, `run`, `wait` or any word. |
| `statusText` | `status` | The text of the status chip. |
| `shape` | `rect` | `rect`, `pill`, `diamond`, `circle`, `hex`, `io`, `db`, `table`, `class` |
| `tone` | none | The colour of the node. |
| `fill` | none | `soft`, `ink` or `solid`. |
| `line` | none | `dashed` for a dashed edge. |
| `size` | none | `sm` for a small node, `dot` for a dot. |
| `hl` | `false` | A highlight ring in the tone. |
| `w` | none | A fixed width in px. The text then wraps. |
| `justify`, `align` | none | The CSS place of the node in its cell. |
| `tip` | none | A tooltip text. |
| `rows` | none | For `table` and `class`: a list of `{ key, name, type }`. |
| `ops` | none | For `class`: a list of method lines. |
| `stereo` | none | For `class`: a line such as `«type»`. |

A row key is `PK`, `FK`, `+` or `-`. An edge can start or end at a row: use `node.row` as its `from` or `to`.

### Edge

| Field | Default | Meaning |
|---|---|---|
| `from`, `to` | required | A node id, or `node.row` for a table row. |
| `a`, `b` | from the positions | The side at the start and at the end: `t`, `r`, `b`, `l`. |
| `label` | none | The text on the edge. |
| `tone` | none | The colour of the line and the mark. |
| `main` | `false` | A thicker line. |
| `dash` | `false` | A dashed line. |
| `flow` | `false` | A moving dashed line. |
| `end` | `arrow` | The mark at the end. |
| `start` | none | The mark at the start. |
| `merge` | `false` | Join the edges into one side of the target on one stem with one arrow. |
| `split` | `false` | Start the edges from one side of the source on one stem. |
| `route` | the graph route | `curve` or `elbow`. |
| `bend` | none | A fixed bend for a curve, in px. |
| `labelDy` | `0` | Move the label down by this number of px. |

Marks: `arrow`, `tri-open`, `diamond`, `diamond-open`, `one`, `one-one`, `many`, `one-many`, `zero-many`, `zero-one`, `none`.

Edges on the same side of a node spread along that side. A merged group shows the label of its first edge.

### Group

| Field | Default | Meaning |
|---|---|---|
| `at` | required | `[row1, col1, row2, col2]`: the first and the last cell. |
| `label` | required | The text on the frame. |
| `icon` | none | An icon before the label. |
| `tone` | none | The colour of the frame. |
| `style` | `dashed` | `dashed`, `solid` or `fill`. |
| `pad` | `16` | The space between the frame and the nodes, in px. |

### Example

```json
{ "type": "graph", "cols": 3, "colGap": 64, "rowGap": 30,
  "groups": [{ "at": [1, 1, 2, 1], "label": "Sources", "icon": "folder", "pad": 12 }],
  "nodes": [
    { "id": "web", "at": [1, 1], "size": "sm", "icon": "monitor", "title": "Web form" },
    { "id": "app", "at": [2, 1], "size": "sm", "icon": "phone", "title": "Mobile app" },
    { "id": "q", "at": [1, 2], "span": [2, 1], "align": "center", "tone": "primary", "icon": "queue", "title": "Order queue" },
    { "id": "db", "at": [1, 3], "span": [2, 1], "align": "center", "shape": "db", "tone": "success", "title": "Orders" }
  ],
  "edges": [
    { "from": "web", "to": "q", "merge": 1, "a": "r", "b": "l", "label": "orders" },
    { "from": "app", "to": "q", "merge": 1, "a": "r", "b": "l" },
    { "from": "q", "to": "db", "label": "writes", "tone": "success" }
  ] }
```

## sequence

A sequence shows the messages between parts in time order. Use it for a request through the code.

| Field | Default | Meaning |
|---|---|---|
| `type` | required | `"sequence"` |
| `parts` | required | The columns: a list of `{ id, label, icon, tone }`. |
| `steps` | required | The rows, in order. |

A step is one of these forms:

| Step | Meaning |
|---|---|
| `{ from, to, label, tone, reply }` | A message. `reply` gives a dashed line and no number. |
| `{ from, to: from, label }` | A self call: a loop back to the same part. |
| `{ frame, cond, over }` | Open a frame: `alt`, `loop` or `opt`. |
| `{ else }` | Divide the open frame. The value is the condition. |
| `{ end: 1 }` | Close the open frame. |
| `{ note, over }` | A note across the parts in `over`. |

- Each message that is not a reply gets a number.
- A part gets an activation bar from its first call to its first reply.
- `over` lists part ids. A frame covers all parts when `over` is empty.
- A long label wraps. A column grows to fit its labels, up to 300 px.

### Example

```json
{ "type": "sequence",
  "parts": [
    { "id": "page", "label": "Shipments page", "icon": "monitor", "tone": "primary" },
    { "id": "api", "label": "Shipments api", "icon": "server", "tone": "success" }
  ],
  "steps": [
    { "from": "page", "to": "api", "label": "GET /shipments", "tone": "primary" },
    { "from": "api", "to": "api", "label": "decode the cursor" },
    { "frame": "alt", "cond": "the cursor is known" },
    { "from": "api", "to": "page", "label": "200 { shipments }", "reply": 1 },
    { "else": "unknown cursor" },
    { "from": "api", "to": "page", "label": "400 unknown cursor", "reply": 1 },
    { "end": 1 }
  ] }
```

## mind

A mind map puts a root in the middle and its branches on two sides. Use it for the parts of a topic.

| Field | Default | Meaning |
|---|---|---|
| `type` | required | `"mind"` |
| `root` | required | A node: `{ t, c }`. |
| `layout` | both sides | `right` puts all branches on the right. |

A node has `t` (the text), `c` (the children) and an optional `tone`. Each first branch gets the next tone of this list: `primary`, `success`, `warning`, `violet`, `danger`, `aqua`. A child takes the tone of its branch.

### Example

```json
{ "type": "mind",
  "root": { "t": "Nook", "c": [
    { "t": "engineering", "c": [{ "t": "items" }, { "t": "gates" }] },
    { "t": "wiki", "c": [{ "t": "shelves" }] }
  ] } }
```

## links

A link graph places pills with a small force layout. Use it for terms and how they connect. The type `force` is the same type.

| Field | Default | Meaning |
|---|---|---|
| `type` | required | `"links"` |
| `nodes` | required | A list of `{ id, label, tone }`. The default tone is `primary`. |
| `links` | required | A list of pairs `[fromId, toId]`. |
| `height` | `440` | The height in px. The width is the width of the element, 640 px or more. |

The dot of a pill grows with its number of links. A pill with 5 links or more gets bold text. A pointer on a pill shows only its links.

### Example

```json
{ "type": "links", "height": 300,
  "nodes": [{ "id": "item", "label": "item" }, { "id": "spec", "label": "spec" }, { "id": "page", "label": "wiki page", "tone": "success" }],
  "links": [["item", "spec"], ["item", "page"]] }
```

## tree

A tree shows what lives under what. Use it for the files of a change or a folder level by level. It uses `bn-tree` from `bundle.css`.

| Field | Default | Meaning |
|---|---|---|
| `type` | required | `"tree"` |
| `items` | required | The top entries. |

| Entry field | Default | Meaning |
|---|---|---|
| `name` | required | The name. |
| `children` | none | The entries under it. An entry with children opens and closes. |
| `open` | `true` | `false` closes the entry at the start. |
| `icon` | `folder` or `file` | A leaf is a file, an entry with children is a folder. |
| `code` | `true` for a file | Show the name in mono. |
| `note` | none | A muted note after the name. It is also the tooltip. |
| `badge` | none | A chip at the end: `{ text, tone }`. |

### Example

```json
{ "type": "tree",
  "items": [{ "name": "api", "children": [
    { "name": "src/shipments.ts", "note": "cuts the list into pages", "badge": { "text": "changed", "tone": "warning" } },
    { "name": "test/store.ts", "badge": { "text": "new", "tone": "success" } }
  ] }] }
```

## timeline

A timeline shows moments in order. It has three styles.

| Field | Default | Meaning |
|---|---|---|
| `type` | required | `"timeline"` |
| `style` | `events` | `events`, `milestones` or `feed`. |
| `items` | required | The entries. Their form depends on the style. |
| `time` | `left` | For `events`: `left` or `right` of the card. |
| `switch` | `false` | For `events`: buttons that move the time. |

| Style | Entry |
|---|---|
| `events` | `{ time, icon, tone, title, text, chips, meter }`, or `{ day }` for a day heading |
| `milestones` | `{ date, title, text, state, icon }` |
| `feed` | `{ icon, code, text, time }` |

- A `meter` is `{ value, max, text, tone }`. It shows a progress bar.
- A milestone `state` is `done`, `now` or empty. The line is green to the last done milestone and blue to the current one.
- The default event icon is `clock`. The default feed icon is `git`.

### Example

```json
{ "type": "timeline", "switch": true,
  "items": [
    { "day": "Thursday 16 Oct" },
    { "time": "10:56", "icon": "play", "tone": "primary", "title": "You typed /auto", "chips": ["mode auto"] },
    { "time": "11:25", "icon": "check", "tone": "success", "title": "Your accept", "meter": { "value": 6, "max": 6, "text": "6 of 6 criteria" } }
  ] }
```

## board

A board shows many things in a few states. Each state that holds items gets a column. The empty states go in a small panel at the end.

| Field | Default | Meaning |
|---|---|---|
| `type` | required | `"board"` |
| `columns` | required | A list of `{ title, tone, cards }`. |
| `rest` | `[]` | The empty states: a list of `{ title, tone, count }`. |
| `restTitle` | `No items` | The heading of the panel of empty states. |
| `emptyText` | `No items` | The text of a column with no cards. |
| `colWidth` | `250` | The smallest width of a column, in px. |
| `colHeight` | `560` | The largest height of the cards of a column, in px. A longer column scrolls inside itself. |

| Card field | Meaning |
|---|---|
| `id` | A short id in mono. |
| `title` | The main text, two lines at most. A longer title ends in an ellipsis, and the tooltip shows all of it. |
| `kind`, `kindTone`, `kindIcon` | A chip with the kind. |
| `size` | A size letter in a box. |
| `areas` | A list of `{ name, tone }`. |
| `meter` | `{ value, max, text, tone }`. |
| `foot` | A list of `{ icon, text, kind }`. `kind` is `wait`, `fail` or `rank`. |
| `auto` | `true` or a word. A chip in the foot. |
| `flag` | `wait` (amber ring), `fail` (red ring) or `muted` (dashed, struck through). |
| `note`, `noteIcon` | A muted line under the title. The default icon is `link`. |

### Example

```json
{ "type": "board",
  "columns": [
    { "title": "Cooking", "tone": "primary", "cards": [
      { "id": "SHOP-7", "kind": "feature", "kindTone": "primary", "kindIcon": "star", "size": "M", "title": "Home page", "meter": { "value": 2, "max": 5, "text": "2/5 slices", "tone": "primary" } }
    ] },
    { "title": "Review", "tone": "warning", "cards": [
      { "id": "SHOP-12", "title": "Name the id in the 404", "flag": "wait", "foot": [{ "icon": "clock", "text": "waits for /close", "kind": "wait" }] }
    ] }
  ],
  "rest": [{ "title": "Backlog" }, { "title": "Ready", "tone": "violet" }] }
```

## chart

A chart draws numbers in SVG. The field `kind` selects the chart.

| Field | Default | Meaning |
|---|---|---|
| `type` | required | `"chart"` |
| `kind` | required | One of the kinds below. |
| `label` | none | The accessible name of the chart. |
| `numbers` | `false` | For `column`, `stack` and `line`: a table of the numbers under the chart. |

The series colours are `--s1` to `--s5`. A pointer on a mark shows its value.

| Kind | Use | Required fields |
|---|---|---|
| `column` | A count for each hour, day or week | `data` |
| `stack` | A whole that splits into parts | `series`, `rows` |
| `line` | A measure over time, against a target | `x`, `series`, `min`, `max` |
| `strip` | Where a thing was at each moment | `rows`, `spans` |
| `calendar` | A habit, one square for each day | `start`, `days` |
| `gap` | How far each part is from its goal | `rows`, `target`, `min`, `max` |
| `quadrant` | Things on two measures | `points` |
| `risk` | Risks by likelihood and harm | `risks` |
| `donut` | The share of each part, five parts or fewer | `parts` |
| `gauge` | One number on a scale with a goal | `items`, `max` |
| `rings` | A few daily goals | `sets` |
| `bars` | Amounts that you compare by name | `rows` |

### column

| Field | Default | Meaning |
|---|---|---|
| `data` | required | A list of `{ label, group, value }`. |
| `step` | `5` | The step of the grid lines. |
| `every` | about 8 labels | Show the label of one column in this number. |
| `unit`, `units` | none | The words in the tooltip, singular and plural. |
| `height` | `190` | The height in px. |

The `group` shows under the label when it changes, for example the date under the hour.

```json
{ "type": "chart", "kind": "column", "unit": "commit", "every": 2,
  "data": [{ "group": "15 Oct", "label": "16:00", "value": 11 }, { "group": "15 Oct", "label": "17:00", "value": 0 }, { "group": "16 Oct", "label": "00:00", "value": 9 }] }
```

### stack

| Field | Default | Meaning |
|---|---|---|
| `series` | required | The names of the parts. They make the legend. |
| `rows` | required | A list of `{ label, values }`, one value for each part. |
| `step` | `10` | The step of the grid lines. |
| `unit` | none | The unit after each total, for example `min`. |

```json
{ "type": "chart", "kind": "stack", "unit": "min", "step": 50, "series": ["spec", "plan", "build"],
  "rows": [{ "label": "SHOP-1", "values": [7, 145, 15] }, { "label": "SHOP-3", "values": [30, 9, 29] }] }
```

### line

| Field | Default | Meaning |
|---|---|---|
| `x` | required | The labels of the points, in order. |
| `series` | required | A list of `{ name, values }`. |
| `min`, `max` | required | The range of the scale. |
| `step` | `1` | The step of the grid lines. |
| `target` | none | A dashed line: `{ value, label }`. |
| `decimals` | `1` | The decimals of the numbers. |
| `height` | `240` | The height in px. |

```json
{ "type": "chart", "kind": "line", "min": 4.5, "max": 7.5, "step": 0.5, "target": { "value": 7, "label": "target 7" },
  "x": ["wk 1", "wk 2", "wk 3"], "series": [{ "name": "Reading", "values": [6, 6, 6.5] }] }
```

### strip

| Field | Default | Meaning |
|---|---|---|
| `rows` | required | The states, from top to bottom. |
| `spans` | required | A list of `{ row, start, end }`, with ISO times. |
| `marks` | `[]` | A list of `{ at, tone, label }`. `danger` draws a cross, other tones a diamond. |
| `tick` | `15` | The minutes between two clock lines. |
| `offset` | the browser zone | The time zone, in minutes from UTC. |

```json
{ "type": "chart", "kind": "strip", "offset": 420, "rows": ["cooking", "review"],
  "spans": [{ "row": "cooking", "start": "2026-10-16T04:02:00Z", "end": "2026-10-16T04:07:00Z" }, { "row": "review", "start": "2026-10-16T04:07:00Z", "end": "2026-10-16T04:25:00Z" }],
  "marks": [{ "at": "2026-10-16T04:25:00Z", "tone": "success", "label": "Your accept" }] }
```

### calendar

| Field | Default | Meaning |
|---|---|---|
| `start` | required | The first day, `YYYY-MM-DD`. Use a Monday. |
| `days` | required | One number for each day, in order. |
| `levels` | `[15, 30, 45, 60]` | The upper limit of each colour step. |
| `unit` | `minutes` | The unit in the tooltip and the scale. |
| `empty` | `none` | The tooltip of a day with 0. |

```json
{ "type": "chart", "kind": "calendar", "start": "2026-07-27", "empty": "no study", "days": [0, 20, 35, 50, 15, 0, 70, 25, 30, 0, 45, 60, 10, 0] }
```

### gap

| Field | Default | Meaning |
|---|---|---|
| `rows` | required | A list of `{ label, value }`. |
| `target` | required | The goal for each row. |
| `min`, `max` | required | The range of the scale. |
| `step` | `1` | The step of the grid lines. |
| `decimals` | none | The decimals of the numbers. |

```json
{ "type": "chart", "kind": "gap", "min": 4, "max": 9, "target": 7, "decimals": 1, "rows": [{ "label": "Task response", "value": 6 }, { "label": "Grammar", "value": 5 }] }
```

### quadrant

| Field | Default | Meaning |
|---|---|---|
| `points` | required | A list of `{ name, x, y, tone, left, tip }`. `x` and `y` go from 0 to 1. |
| `corners` | none | Four `{ name, say }`: top left, top right, bottom left, bottom right. |
| `x` | none | The words of the horizontal axis: `{ less, more, name }`. |
| `y` | none | The words of the vertical axis: `{ less, more }`. |
| `height` | `420` | The height in px. The width is 600 px or more. |

`left` puts the name of a point on the left of its dot.

```json
{ "type": "chart", "kind": "quadrant", "height": 320,
  "corners": [{ "name": "Do first" }, { "name": "Plan for it" }, { "name": "Small extras" }, { "name": "Later or never" }],
  "x": { "less": "less work", "more": "more work" }, "y": { "less": "less value", "more": "more value" },
  "points": [{ "name": "/report week", "x": 0.14, "y": 0.6, "tone": "success" }, { "name": "Jira pack", "x": 0.9, "y": 0.32, "left": true, "tone": "warning" }] }
```

### risk

| Field | Default | Meaning |
|---|---|---|
| `risks` | required | A list of `{ n, likely, harm, title, text }`. `likely` and `harm` go from 1 to 5. |
| `levels` | `low`, `medium`, `high`, `act before the build` | The names of the four levels, as `{ "1": …, "4": … }`. |
| `note` | the axes in words | The line under the grid. |

The level comes from `likely × harm`: 15 or more is 4, 10 or more is 3, 5 or more is 2. A risk with a `title` also shows in a list on the right.

```json
{ "type": "chart", "kind": "risk", "risks": [{ "n": 1, "likely": 4, "harm": 2, "title": "A wide diagram on a phone." }, { "n": 2, "likely": 2, "harm": 5, "title": "The build breaks the install." }] }
```

### donut

| Field | Default | Meaning |
|---|---|---|
| `parts` | required | A list of `{ label, value }`. |
| `center` | none | The word under the total in the middle. |
| `unit`, `units` | none | The words in the tooltip. |

```json
{ "type": "chart", "kind": "donut", "center": "tests", "unit": "test", "parts": [{ "label": "engineering", "value": 332 }, { "label": "core", "value": 132 }] }
```

### gauge

| Field | Default | Meaning |
|---|---|---|
| `items` | required | A list of `{ label, value }`. One gauge for each item. |
| `max` | required | The end of the scale. The scale starts at 0. |
| `goal` | none | A mark on the scale, and the distance to it under the label. |
| `decimals` | none | The decimals of the numbers. |

```json
{ "type": "chart", "kind": "gauge", "max": 9, "goal": 7, "decimals": 1, "items": [{ "label": "Listening", "value": 6 }] }
```

### rings

| Field | Default | Meaning |
|---|---|---|
| `sets` | required | A list of `{ label, rings }`. One card for each set. |

A ring is `{ label, value, max }`. A set holds three rings or fewer.

```json
{ "type": "chart", "kind": "rings", "sets": [{ "label": "Today", "rings": [{ "label": "minutes", "value": 35, "max": 50 }, { "label": "cards", "value": 12, "max": 20 }] }] }
```

### bars

| Field | Default | Meaning |
|---|---|---|
| `rows` | required | A list of `{ label, value, tone, highlight }`. The default tone is `primary`. |
| `max` | the largest value | The value of a full bar. |

The bars use `bn-bars` from `bundle.css`.

```json
{ "type": "chart", "kind": "bars", "rows": [{ "label": "engineering", "value": 332 }, { "label": "wiki", "value": 21, "highlight": true }] }
```

## Styles

The diagram styles read the Bench tokens and do not define them. The comment at the start of the diagram part of `bundle.css` lists the tokens.

The diagram styles set their own variables:

| Variable | Use |
|---|---|
| `--violet`, `--aqua` and their `-subtle` | Two tones that Bench does not have |
| `--s1` to `--s5` | The series colours of the charts |
| `--q0` to `--q5` | The steps of the calendar |
| `--r-shape`, `--r-card`, `--r-board`, `--r-frame`, `--r-tile` | The corners of the box roles |
| `--edge`, `--lift`, `--lift-ink` | The ring and the shadows of the box roles |

The "Box roles" block is the one place that sets the corner, the edge and the shadow of each box:

| Role | Boxes | Look |
|---|---|---|
| shape | a node of a graph | `--r-shape`, a 1px ring and a soft lift in its tone |
| frame | a group, a board column | `--r-frame`, no shadow on a dashed line |
| card | a timeline card, a milestone, a feed, a gauge, a ring set | `--r-card`, a 1px ring and a soft lift |
| board | a card on a board | `--r-board`, a 1px ring and a soft lift |

- Corners use `corner-shape: superellipse(1.4)` where the browser supports it.
- A box never rounds past about a third of its height, so a short box is not a pill.
- The labels on edges and frames sit on `--dg-bg`. Set `--dg-bg` on the element when the diagram is not on `--bg`.
