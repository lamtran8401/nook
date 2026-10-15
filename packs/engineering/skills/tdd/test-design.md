# Test design: what to test and where

Think before you test. A test proves a behavior. A test that proves the code you just wrote proves nothing.
The goal is the fewest tests that fail when the behavior breaks. Many tests that cannot fail cost CI time and hide the real gaps.

## The five questions
Answer them in your notes before the first test of a slice. One or two lines each.
1. Which behavior changes? Name it from the criterion: an input, an action and the visible result.
2. What can break? The inputs and the states: empty, large, wrong, missing, at the same time. The callers of the code you change.
3. Which test of the area proves part of it already? Search the tests next to the code and the tests of the callers. Read them.
4. Which layer is the lowest one that proves it with confidence? See the table.
5. Is a new test necessary? When a test proves the behavior already, add a case to it. Change an old test only because the criterion changed.

## The layers
| Layer | Proves | Example |
|---|---|---|
| unit | one function or one rule of the logic: fast, many cases, no edge of the system | the public status list has 5 entries |
| service edge | a request in, a response out: the contract, the validation, the error codes | `GET /shipments?status=x` returns only the rows with status x |
| component | what a user sees and does: render, act, assert the text or the state | the banner reads "Unable to filter" when the query fails |
| integration | two parts that talk: a query against a real schema, a call between two services | the filter uses the index |

- Pick the lowest layer that sees the behavior. A rule of the logic is a unit test, not an integration test.
- A behavior that shows only at the edge (a status code, an error text) is a service-edge or a component test.
- One negative case for each criterion: an input or a state that the behavior must refuse or leave unchanged.

## What you write down
```
AC2 (a status narrows the list)
  changes   GET /shipments?status=x returns only the shipments with status x
  breaks    unknown status, no status, 500 rows, the export that uses the same query
  exists    list.test.ts "returns all shipments" covers no status
  layer     service edge: list.test.ts
  tests     new "filters by status"; new "an unknown status returns an empty list"; extend nothing
```

## Gotchas
- A test that repeats the formula of the code passes when the formula is wrong. Write the expected value by hand.
- A test that checks only that a mock was called proves the mock. Assert the result.
- Two tests that prove one behavior on one layer double the cost and add no proof. Keep one.
- A test for a behavior that the criteria do not name is out of scope. Name it in your summary instead.
- Do not delete or weaken an old test to make room. A test that is wrong now is a question for the lead.
