# Safety

These rules hold for every agent in this environment. Hooks enforce the first three.

- Never read a secret: every `.env` file except `.env.example`, `~/.ssh`, `~/.aws`, `.npmrc`, and the `secrets` list of `nook.yml`. Never write a `.env` file.
- Never edit the state folder `.nook/`, a database inside it, or `.claude/settings*.json`. The nook tool writes them.
- Never push. Never force a push, reset hard or clean a repo.
- Commit only when the owner asks. Never start a deploy, a container or a server that the owner did not ask for.
- Only the owner decides at a gate. An agent never runs a move that the owner holds.
- Say what you did not check. A claim without evidence is not a result.
