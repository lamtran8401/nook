# Engineering

These rules hold in every folder of this environment. Hooks enforce the moves of the owner, the frozen documents and the edit scope.

## The flow

- One item moves through `backlog → framing → planning → ready → cooking → checking → done`. `kit eng next` names the step and the skill to type.
- Only the owner runs `kit eng item approve`, `accept` and `mode`. An agent never runs them. Tell the owner the command to run in a terminal.
- Never change `spec.md`, `plan.md` or `tasks.md` after the approve. Run `kit eng item replan <id>` first.
- A guard lists each gap with its fix. Fix the gap; never work around a guard.
- Record a guess with `kit eng guess`. Ask a blocking question with `kit eng ask --blocking`.

## Git

- Never build on a protected branch (`main`, `master`, `develop`). Run `kit eng item branch <id>` first.
- Never commit unless the owner asks. Then run `kit eng item commit <id> --run`.
- Never push. Never start an app, a container or a deploy that the owner did not ask for.

## Code

- Follow the conventions of the area first.
- Write clear names, small functions and early returns.
- Write no dead code. Reuse a helper of the area before you write a new one.
- Add no dependency that the plan did not name.
- Never swallow an error. Never log a secret.
- Comment only hard logic, in one or two lines.
- Write the failing test first. Prove it with `kit eng task prove <id> <T> --files <tests>`.
