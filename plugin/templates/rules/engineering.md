# Engineering

These rules hold in every folder of this workspace. Hooks enforce the moves of the owner and the safety rules. The door of each move (begin, submit, accept) shows what changed.

## The flow

- One item moves through `backlog → framing → planning → ready → cooking → review → done`. `nook eng next` names the step and the skill to type.
- A stage skill with no item id takes the one open item that `nook eng next` sends to that skill. With none or several, ask with AskUserQuestion: the two likeliest items as options, the others named in the question.
- Only the owner runs `approve`, `accept` and `mode`. An agent never runs them. Tell the owner to type `/gate <move> <id>` in the prompt.
- After the approve, change `spec.md`, `plan.md` or `tasks.md` only for a small fix. For a change of substance, run `nook eng item replan <id>` first. The accept names each changed document.
- A guard lists each gap with its fix. Fix the gap; never work around a guard.
- Record a guess with `nook eng guess`. Ask a blocking question with `nook eng ask --blocking`, then ask the owner with AskUserQuestion and record the answer.

## Git

- Never build on a protected branch (`main`, `master`, `develop`). Run `nook eng item branch <id>` first.
- Never commit unless the owner asks. Then run `nook eng item commit <id> --run`.
- Push only when the owner asks, as with `/pr`. Never start an app, a container or a deploy that the owner did not ask for.

## Code

- Follow the conventions of the area first.
- Write clear names, small functions and early returns.
- Write no dead code. Reuse a helper of the area before you write a new one.
- Add no dependency that the plan did not name.
- Never swallow an error. Never log a secret.
- Follow the base rule `comments` for every comment.
- Write the failing test first. Prove it with `nook eng task prove <id> <T> --files <tests>`.
