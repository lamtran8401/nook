---
name: clean-code
description: "Read your own diff as the next reader will: names, one job for each function, the helpers of the area reused, no dead code, every error handled, no secret in a log. Use in the refactor step and before task done. Not for another's diff: /review."
allowed-tools: Bash(git diff *), Bash(git status *), Read, Glob, Grep, Edit
---

Goal: a diff that a reviewer reads once and understands, with nothing to remove.
The code rules are in the base rules (`.claude/rules/nook/engineering.md`). This skill is how you check a diff against them.
The fresh reviewer blocks on a fixed list; find those points yourself first, in the agent file of `nook:code-reviewer`.

## When
1. In the refactor step of `tdd`, with the tests green: the code of the behavior you just made pass.
2. Before `nook eng task done`: the full diff of the slice, `git diff` in the folder of the slice.

## Order
1. The area first. Read the lint config and the code next to the change. Your names, folders and error handling look like theirs.
2. Read the diff file by file. For each new or changed function: does the name say what it does; does it do one job; does it return early instead of nesting.
3. Search for a helper that does the work already: the verb and the noun of your name (`formatDate|toDateString`). Reuse it.
4. Remove what does not belong: a debug print, code in a comment, an unused import or parameter, a file that no test or caller uses.
5. Check each error path. An empty catch, or an error that is dropped, hides a failure. Handle it or return it to the caller.
6. Check each log line: never a secret, a token or a personal field.
7. Check each comment. Keep one only on hard logic, one or two lines, what and why. Delete one that tells history or repeats the code.
8. Check each lint rule you turned off. It needs its reason on the same line, or it goes.
9. Run the lint and the tests of the area. A refactor keeps every test green.

## The limit
- Tidy only the code of the slice. A cleanup outside it is a new item: name it in your summary.
- No dependency that the plan did not name.

One line in the summary of the slice:
```
Clean code: reused formatDate (src/util/date.ts) in place of a new helper; removed 2 debug prints; no lint rule off.
```

## Gotchas
- A second copy of a helper passes every test and drifts later. The reviewer blocks it. Search before you write.
- A rename across many files is a refactor of its own. Do not mix it into a slice that changes a behavior.
- When you want a long comment, a better name or a smaller function is often the fix.
- A test that cannot fail is on the blocking list too. Check your tests as you check your code.
