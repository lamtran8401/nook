# Comments

These rules hold for every code file in this desk, in any language and in any pack.

- Write code that needs no comment: clear names, small functions, early returns.
- Comment only hard logic, in one or two lines: what it does and why.
- Never write history, a decision log or a "kept for" note in a comment. Git holds the history.
- Never leave code in a comment.
- Delete a comment that repeats the name or the code.
- A long comment asks for a better name or a smaller function.

```ts
// a mouse notch sends ~100 px and a pinch ~5; cap each step near 10%
const step = clamp(-dy * rate, -0.1, 0.1)
```

The comment above says why the cap exists. A comment such as `// set the step` repeats the code: delete it.
