# How to start a builder

A builder is a teammate: a separate session with its own context, alive for the whole item. It does not see this conversation.
The brief is all that it knows about the item, so it comes from the tool, not from your memory.
One builder for each area of the item, at most 4 at once. A second slice in the same area goes to the same builder.

## The call
1. Run `kit eng task brief <id> <T>`. It prints the slice: the item, the area and its folder, the ACs, the `done when` line, the open guesses, and the commands the builder runs.
2. Call the Agent tool:
   - `name`: `<area>-builder`, for example `bff-builder`. The name makes it a teammate, and the TeammateIdle hook holds it on its slice by this name.
   - `subagent_type`: `kit-engineering:backend-builder` for an area of kind `backend`, `kit-engineering:frontend-builder` for `frontend`. Another kind (`docs`, `data`, `tool`) gets the backend builder.
   - no `run_in_background`.
   - `prompt`: the output of `task brief`, word for word. Add a line only when the brief lacks the folder of the area.
3. The next slice of the same area: `kit eng task brief <id> <T2>`, then SendMessage to `<area>-builder` with the brief, word for word. A message is plain text; the builder runs the commands itself.
4. A builder that goes idle and left the slice `running` is held by the hook once. When it still stops, send one message: finish with `kit eng task done` or `task wait`.

## When agent teams are off
A headless run (`claude -p`) makes no teammates. The same call with `run_in_background: true` and no `name` makes a background subagent with the same brief.
Each slice then gets its own subagent; the SubagentStop hook holds it on its slice.

## What the builder does with it
The hook puts `--as builder` into each of its `kit eng` calls, so it can move only its own slice.
```
kit eng task start <id> <T>
  ... test first, one behavior at a time ...
kit eng task prove <id> <T> --files <the new test files>
kit eng task done <id> <T> --files <every changed file>
kit eng task wait <id> <T> --reason "<question>"          when an answer changes the work
kit eng task fail <id> <T> --reason "<tried, saw>"        after three failed tries
kit eng guess <id> "<question>" --took <a> --other <b> --impact low|med|high --slices <T>
```

## Limits
- At most 4 builders at once, one for each area. Never two builders in one folder.
- A builder cannot start builders. Only the lead dispatches.
- The edit hook lets a builder write only in the area of its slice. A fix elsewhere comes back as a `task wait`.
- A builder's permission prompts reach the lead session. Answer them; a prompt stalls the builder.
- A teammate does not preload skills; its agent file stands alone with the brief.
- After a `/resume` or a compaction, the teammates are gone. `kit eng task list <id> --state running` shows the slices to give to a new builder with the same brief.

## When a builder returns
Read its summary against the ledger, not the other way round:
- `kit eng task show <id> <T>`: state `done`, files recorded, proof `proven`. A proof `weak` or `none` needs a reason in `proof_note`.
- The tests it names exist in the files it recorded.
- The guesses it says it recorded are in `kit eng guesses <id>`.
- "Not checked" lines go into the report of the stage as manual checks for the owner.
