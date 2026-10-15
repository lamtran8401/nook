# How to start a builder

A builder is a background subagent with its own context. It does not see this conversation.
The brief is all that it knows about the item, so it comes from the tool, not from your memory.

## The call
1. Run `kit eng task brief <id> <T>`. It prints the slice: the item, the area and its folder, the ACs, the `done when` line, the open guesses, and the commands the builder runs.
2. Call the Agent tool:
   - `subagent_type`: `kit-engineering:backend-builder` for an area of kind `backend`, `kit-engineering:frontend-builder` for `frontend`. Another kind (`docs`, `data`, `tool`) gets the backend builder.
   - `run_in_background: true`.
   - `prompt`: the output of `task brief`, word for word. Add a line only when the brief lacks the folder of the area.
3. Note the agent id with the slice. A builder that returns and left the slice `running` gets one message: finish with `kit eng task done` or `task wait`.

## What the builder does with it
The hook gives each of its `kit eng` calls `KIT_ROLE=builder`, so it can move only its own slice.
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
- At most 4 builders at once, one for each area. `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS=4` in the settings holds the first.
- A builder cannot start builders (`CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH=1`). Only the lead dispatches.
- The edit hook lets a builder write only in the area of its slice. A fix elsewhere comes back as a `task wait`.
- A builder's permission prompts reach the lead session. Answer them; a prompt stalls the builder.
- After a `/resume` or a compaction, the running builders are gone. `kit eng task list <id> --state running` shows the slices to restart with a new builder and the same brief.

## When a builder returns
Read its summary against the ledger, not the other way round:
- `kit eng task show <id> <T>`: state `done`, files recorded, proof `proven`. A proof `weak` or `none` needs a reason in `proof_note`.
- The tests it names exist in the files it recorded.
- The guesses it says it recorded are in `kit eng guesses <id>`.
- "Not checked" lines go into the report of the stage as manual checks for the owner.
