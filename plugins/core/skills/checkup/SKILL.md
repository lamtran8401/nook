---
name: checkup
description: "Run nook doctor and explain each gap with its fix, then fix the part that is the agent's and list the part that is the owner's. Use when the owner says checkup, something feels off, or after a Nook update."
disable-model-invocation: true
allowed-tools: Bash(nook *), Bash(cat *), Read, Glob
---

Goal: the owner knows what is wrong in this environment and what to do, in one short report.

## Order
1. Run `nook doctor --json` and `nook doctor`.
2. For each gap, say in one line what it means for the work, and the fix. Group the gaps: the agent can fix (a missing block, a missing rule file), the owner must decide (a conflicting rule, a pack that does not exist, a secret path).
3. Fix the agent's part: run `nook init --update` when a gap names it. Do not edit `nook.yml` or `CLAUDE.md` outside the block.
4. Prove that the guards work: ask to read `.env.nook-canary` through the Read tool. The hook must refuse. Report "guards: on" or "guards: off, the hook did not run".
5. Run `nook doctor` again and report what is left.

## Gotchas
- A doctor that reports no gap and a guard that does not run is a broken environment. Always do step 4.
- A hook that cannot start (a wrong path) does not block. When the canary read goes through, say that the plugin is not installed or not enabled for this user.
- The report starts with what waits for the owner, or "Nothing waits for you".
