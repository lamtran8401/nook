# The review rubric

## The verdict
- accept: every AC is marked with evidence, the full checks pass, and no blocking finding remains.
- send back: one AC is not met, a check fails, or a blocking finding remains.
- A blocking finding breaks an AC, a changed contract or the scope of the spec, or it is a test that cannot fail.
  It has four parts: where (file and line), what, why it matters, how to show it fails.
- The blocking list of `kit-engineering:code-reviewer` is in its agent file. Only that list sends work back from the code review.
- A nit does not change the behavior: a name, a comment, a style point. Nits go to the owner as a list. They never send the item back.
- Not confirmed: what the agents could not check, and where they looked. The owner reads it before the accept.

## The grades of the evidence
| Grade | Means | Example |
|---|---|---|
| run | a test or a command ran and its output shows the result | `list.test.ts:42` fails on the base and passes on the branch |
| sourced | a file and line show the behavior, no run | `ShipmentList.tsx:60` renders the text "Unable to filter" |
| judged | a reading of the code with no test and no line that shows it alone | the order of the statuses follows the API, by reading `list.ts:40-48` |
| owner | only the owner can check it, by hand | the banner on the page |

The weakest grade shows first in the report and at the accept.
An AC with grade `owner` needs the manual check in the report, with what the owner must see.

## Evidence for an AC
| Weak | Strong |
|---|---|
| "The filter is implemented." | `list.test.ts:42` fails on the base and passes on the branch (run). |
| "Tests pass." | `kit eng item verify`: bff 212 passed, 0 failed, the full suite (run). |
| "The banner shows." | `ShipmentList.test.tsx:60` asserts the text "Unable to filter" (run). |

## The negative case
One for each AC: an input or a state that the AC must refuse or leave unchanged.
- "the filter lists every public status": an internal status adds no option.
- "a status narrows the list": an unknown status returns an empty list, not an error.
- "the old client keeps working": a call with no `status` returns the old result.

## The report
```
Waits for you: accept: type /gate accept SHOP-12
Verdict: accept. Weakest evidence first:
- AC4 owner: the banner on the page. Check: pick a status with the API down; the list stays and the banner reads "Unable to filter".
- AC5 sourced: export.ts:31 passes the status. No test measures the exported rows.
- AC1, AC2, AC3 run: list.test.ts:42-71, fail on the base and pass on the branch.
Blocking: none. Nits: list.ts:44 names the parameter `s`.
Not confirmed: the time for 500 shipments; looked in list.test.ts and the Tests section.
Next: /close SHOP-12 after the accept. /walkthrough SHOP-12 for a guided review.
```
A send-back starts with the unmet AC or the blocking finding, then the `kit eng item reject` that ran, then `/cook <id>`.
