# Safety

These rules hold for every agent in this workspace. Hooks and the settings enforce the first three.

- Never read a secret: every env file (`.env`, `.env.local`, `prod.env`) except `.env.example`, `~/.ssh`, `~/.aws`, `~/.config/twg`, `~/.config/gh`, `.npmrc`, and the `secrets` list of `nook.yml`. Never write a `.env` file.
- Never edit the state folder `.nook/`, a database inside it, or `.claude/settings*.json`. The `nook` tool writes them.
- Push only when the owner asks, as with `/pr`; the settings ask the owner before each push. Never force a push, reset hard or clean a repo.
- Commit only when the owner asks. Never start a deploy, a container or a server that the owner did not ask for.
- Only the owner decides at a gate. An agent never runs a move that the owner holds.
- Say what you did not check. A claim without evidence is not a result.
