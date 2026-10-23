# Expect: the reset

The plan is `docs/plan/reset.md`. Each row must pass before its slice is done.

## R1: remove learn

| # | Given | When | Then |
|---|---|---|---|
| E1 | the repo | `git grep -i learn` runs on code, plugin and docs | no line names the learn pack, its commands, skills or agent |
| E2 | a workspace with a `learn:` section | `nook doctor` runs | it names the section as a gap: delete it |

## R2: one plugin, features by section

| # | Given | When | Then |
|---|---|---|---|
| E3 | the repo | the plugins are listed | `plugin/` is the one plugin, named `nook`, with every skill, agent and hook |
| E4 | a `nook.yml` with an `engineering:` section | `nook init` runs | the rules `engineering` and `testing` are written |
| E5 | a `nook.yml` with no `wiki:` section | a wiki command runs | it says the wiki is off and names the section to add |
| E6 | a `nook.yml` with `packs: [engineering]` | `nook doctor` runs | it names `packs:` as a gap with its fix |
| E7 | a child workspace with no `engineering:` under a parent with one | an engineering command runs in the child | the parent is the home of the feature |

## R3: desk becomes workspace

| # | Given | When | Then |
|---|---|---|---|
| E8 | the repo | `git grep -i -w desk` runs on code and docs | no line uses the word, except a note of the rename in the report |
| E9 | a folder with the old nook block in `CLAUDE.md` | `nook init --update` runs | the block says workspace |

## R4: the config

| # | Given | When | Then |
|---|---|---|---|
| E10 | `guards.commands.allow: [gh pr create]` | `nook init --update` runs | `.claude/settings.json` allows `Bash(gh pr create*)` |
| E11 | `guards.commands.allow: []` and no deny | `nook init --update` runs | the deny list still holds force push, reset hard, clean and the secret reads |
| E12 | a rule that nook wrote, then left `nook.yml` | `nook init --update` runs | the rule leaves the settings; a rule that the owner wrote stays |
| E13 | a parent allows `bun test`, a child allows `gh pr view` | `nook init --update` runs in the child | the child's settings allow both |
| E14 | `budget: wild` | `nook doctor` runs | it names the value as a gap: lean or deep |

## R5: guards at the door

| # | Given | When | Then |
|---|---|---|---|
| E15 | an item in review, an area file, no running slice | the lead edits the file | the edit passes; the item's history shows the file as an edit outside a slice |
| E16 | an approved item whose `plan.md` changed | the owner checks the accept | the gaps of the accept name "plan.md changed since the approve" as a note; the accept can still run |
| E17 | an item in cooking with a slice that has no proof | the lead runs submit | the submit stops and names the slice, as today |
| E18 | an agent | it runs `nook eng item accept` | the guard blocks it, as today |
| E19 | a reader agent | it writes a file | the guard blocks it, as today |
| E20 | a lead with an open blocking question | it stops | the stop passes; only a yolo run is driven |

## R6: one skill, one job

| # | Given | When | Then |
|---|---|---|---|
| E21 | the plugin | its skills are listed | the set matches the table of the plan; `/specify`, `/plan`, `/daily-brief`, `/review`, `/debug`, `/pr` exist |
| E22 | each skill | its description is read | it says what the skill does and when to use it, and no two skills share a trigger |
| E23 | `budget: lean` | `/cook` reads its brief | the brief says lean: the main session builds unless two areas run |
| E24 | a `/yolo` run | the lead reads the stage | the stage text says nobody watches: record a guess, never ask |

## R7: ids by kind

| # | Given | When | Then |
|---|---|---|---|
| E25 | no items | `nook eng item new "Fix the date" --kind fix` runs | the id is `BUG-001` |
| E26 | `WI-001` and `WI-002` exist | a feature with no id is made | the id is `WI-003` |
| E27 | `INV-004` turns into a fix | its kind changes | the id stays `INV-004` |

## R8: the v3 look

| # | Given | When | Then |
|---|---|---|---|
| E28 | any page | it shows | no card holds a card; a section is a heading on the ground |
| E29 | the inbox with an approve and an answer | it shows | the call rows are the one amber tone; states are dots and words |
| E30 | the accept row of an item with a changed plan | it shows | the criteria, the checks and the door line show beside Accept |
| E31 | the board | the owner picks the view Bugs | only fixes show; done and backlog fold to strips |
| E32 | the Harness page | it shows | the secrets, the commands, the budget, the areas, the rules on and the hooks |
| E33 | a plan diagram | it draws | nodes are tinted shapes with a 1px ring and no shadow; groups have no dashed line; no frame around the figure |
| E34 | a page in dark mode, at 390 px | it shows | no text reads dark on dark; no line runs off the page |

## R9: the docs

| # | Given | When | Then |
|---|---|---|---|
| E35 | each Markdown file of `docs/` and `plugin/` | `nook ste` runs | it scores above 80% |
| E36 | the report | it is read | its numbers match `nook --help`, the plugin and `bun run check` |
