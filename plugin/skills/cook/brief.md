# How to start a builder

A builder works in its own context and does not see this conversation.
The brief is all that it knows about the item, so it comes from the tool, not from your memory.
Each agent loads the rules and reads the files again, so the budget of the workspace decides how many run.

## Who builds a slice
| Budget | Case | Who |
|---|---|---|
| lean (the default) | one area | the lead itself, slice after slice, with the same commands as a builder |
| lean | two areas or more | the lead builds one area; one background subagent builds the other areas, one after the other |
| deep | an area with one slice | a background subagent, no `name`, the brief as its prompt |
| deep | an area with two or more slices | a teammate `name: <area>-builder`, alive from `begin` to `submit` |

A teammate costs many times the tokens of a subagent. Give a `name` only on a deep budget, in the last case.
The lead that builds a slice runs `nook eng task start`, `task prove` and `task done` itself, so the slice runs while its files change.

## The call of a teammate
1. Run `nook eng task brief <id> <T>`. It prints the slice: the item, the area and its folder, the ACs, the `done when` line, the open guesses, and the commands the builder runs.
2. Call the Agent tool:
   - `name`: `<area>-builder`, for example `bff-builder`. The name makes it a teammate, and the TeammateIdle hook holds it on its slice by this name.
   - `subagent_type`: `nook:backend-builder` for an area of kind `backend`, `nook:frontend-builder` for `frontend`. Another kind (`docs`, `data`, `tool`) gets the backend builder.
   - no `run_in_background`.
   - `prompt`: the output of `task brief`, word for word. Add a line only when the brief lacks the folder of the area.
3. The next slice of the same area: `nook eng task brief <id> <T2>`, then SendMessage to `<area>-builder` with the brief, word for word. A message is plain text; the builder runs the commands itself.
4. A builder that goes idle and left the slice `running` is held by the hook once. When it still stops, send one message: finish with `nook eng task done` or `task wait`.

## The call of a subagent
The same call with `run_in_background: true` and no `name`. The SubagentStop hook holds it on its slice.
A headless run (`claude -p`) makes no teammates: every builder is a subagent there.

## What the builder does with it
The hook puts `--as builder` into each of its `nook eng` calls, so it can move only its own slice.
```
nook eng task start <id> <T>
  ... test first, one behavior at a time ...
nook eng task prove <id> <T> --files <the new test files>
nook eng task done <id> <T> --files <every changed file>
nook eng task wait <id> <T> --reason "<question>"          when an answer changes the work
nook eng task fail <id> <T> --reason "<tried, saw>"        after three failed tries
nook eng guess <id> "<question>" --took <a> --other <b> --impact low|med|high --slices <T>
```

## Limits
- At most 4 builders at once, one for each area. Never two builders in one folder.
- A builder cannot start builders. Only the lead dispatches.
- The edit hook lets a builder write only in the area of its slice. A fix elsewhere comes back as a `task wait`.
- A builder's permission prompts reach the lead session. Answer them; a prompt stalls the builder.
- A teammate does not preload skills; its agent file stands alone with the brief.
- After a `/resume` or a compaction, the teammates are gone. `nook eng task list <id> --state running` shows the slices to give to a new builder with the same brief.

## When a builder returns
Read its summary against the ledger, not the other way round:
- `nook eng task show <id> <T>`: state `done`, files recorded, proof `proven`. A proof `weak` or `none` needs a reason in `proof_note`.
- The tests it names exist in the files it recorded.
- The guesses it says it recorded are in `nook eng guesses <id>`.
- "Not checked" lines go into the report of the stage as manual checks for the owner.
