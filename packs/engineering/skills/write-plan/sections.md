# The sections of plan.md

| Section | Holds | Does not hold | Lines |
|---|---|---|---|
| Architecture | the parts that change and how they connect today, one fact for each line with `area path:line`; the tests that exist; the contract files and their consumers; what is not there when it matters; the unknowns | a choice, an opinion, the new design, pasted code | 30 |
| Design | the chosen solution in plain steps of the change; each key decision with its reason; the contract impact and the data impact ("none" when none); the rejected options with one reason each; the decisions that outlive the item | a list of work steps, the slices | 40 |
| Steps | the order of the work across areas; what must be true before each step and what works after it; compatibility when one area is on the new version and another on the old; rollout; rollback and what it leaves behind; which step is hard to undo and who runs it | the slices, the code | 25 |
| Tests | for each AC: the area, the layer (unit, service edge, component, integration, manual), the behavior in one sentence, and one negative case; the tests that must stay green; the command for each area | the test code | 30 |
| Risks | what can fail, with the effect, how likely (low, med, high) and how you detect or reduce it; the risk nobody sees (no data, a large list, a slow call, two versions at once); what is left out on purpose; the guesses the plan relies on | a generic risk of any project, a risk the design already removes | 20 |

A full `plan.md` for SHOP-12: `${CLAUDE_PLUGIN_ROOT}/skills/recipe/example.md`.

## The bar for each section
- Architecture: a reader finds each file in one minute from the path and the line. Each line states a fact in the present tense. A longer section means you wrote the design.
- Design: the owner approves this text. A decision with no reason cannot be approved; a design that hides the other options hides the risk. A decision that you cannot explain in one sentence is not decided: read the code again.
- Steps: areas deploy apart, so a wrong order breaks a running system. "Deploy together" is a risk: say which area ships first. A one-area item still has an order: the test, then the change, in one line.
- Tests: the builders write tests first from this section, and the reviewer uses it to decide if a criterion is met. Use the lowest layer that proves the criterion. Mock the edge (network, database, clock), never the code under test. Agents cannot start the app, so a visual check is always manual.
- Risks: an owner who sees a risk before the build accepts it or changes the plan; one who sees it at review pays twice. "Not done on purpose" is a promise that the reviewer reads.

## Two snippets
```markdown
## Design
Add `status` as an optional query parameter of the list in bff. The frontend sends it from a new filter control.
- Decision: the parameter is optional. Reason: old frontends keep working during the rollout.
- Decision: the filter runs in the query. Reason: the list has up to 5,000 rows.
- Contract impact: none. Data impact: an index on `status` (`schema.sql:88` shows none).
Rejected: a new endpoint `/shipments/by-status`. It repeats the list contract and doubles the consumers.
```
```markdown
## Tests
- AC2 (a status narrows the list): bff service-edge test with two statuses. Negative: an unknown status returns an empty list, not an error.
- AC4 (the banner): frontend component test with a failing query asserts "Unable to filter". Negative: a slow query shows no banner.
- Keep green: `list.test.ts` (bff), `ShipmentList.test.tsx` (frontend). `kit eng item verify SHOP-12` runs both areas.
```
