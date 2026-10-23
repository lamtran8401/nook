---
name: pr
description: "Open a pull request for the current branch: a title, a summary of what changed and why, how to test it, and the criteria of the item when there is one. Use when the owner says pr, pull request, open a PR or send it for review."
argument-hint: "[item id] [--draft]"
disable-model-invocation: true
allowed-tools: Bash(git status *), Bash(git log *), Bash(git diff *), Bash(git branch *), Bash(git rev-parse *), Bash(gh pr *), Bash(gh repo view *), Bash(gh auth status*), Bash(nook eng *), Read
---

Goal: a pull request that a reviewer understands in two minutes, opened from the right branch to the right base.

## Order
1. Check the branch: `git branch --show-current`. A protected branch (`main`, `master`, `develop`) stops here: say to make a branch first.
   `git status --short` with changes that are not committed stops here too: say what is left, and commit only when the owner asks.
2. Find the base: the protected branch that the branch came from, or `gh repo view --json defaultBranchRef`.
3. Read the change: `git log --oneline <base>..HEAD` and `git diff --stat <base>...HEAD`. With an item id, read `nook eng item brief <id>`, `nook eng item ac list <id>` and the walkthrough when it exists.
4. Write the title, 70 characters or fewer, in the words of the change. Write the body:
   - Summary: what changed and why, in two or three lines.
   - Changes: one line for each part, in plain words.
   - How to test: the commands or the steps.
   - Criteria (with an item): each met criterion with its evidence.
5. Check the account: `gh auth status`. When the remote belongs to another account than the one logged in, stop and ask the owner.
6. Push the branch: `git push -u origin <branch>`. The settings ask the owner first; a refusal stops here.
7. Open the pull request: `gh pr create --base <base> --title "<title>" --body "<body>"`, with `--draft` when the owner asked or a check fails.
8. Report the link of the pull request and what is left, such as a check that failed.

## Gotchas
- Never force a push and never push a protected branch.
- The body holds no secret, no token and no inner link that the reviewer cannot open.
- A failing check is not hidden: open the pull request as a draft and name the check.
- With no item, the summary comes from the commits and the diff only. Do not invent criteria.
