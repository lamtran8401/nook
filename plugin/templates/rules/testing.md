---
paths:
  - "**/*.test.*"
  - "**/*.spec.*"
  - "**/*_test.*"
  - "**/test_*.py"
  - "**/tests/**"
  - "**/test/**"
  - "**/__tests__/**"
---
# Tests

## Write a test
- Before you add a test, look for a test of the area that proves the behavior already. Extend it when it does.
- Write the test first. Run it and see it fail for the right reason. Then write the code.
- A test name states the behavior: `returns the shipments that match the status`. Never name a test by a ticket or a scenario id.
- A test checks one behavior. It asserts a visible result: a return value, a response, a rendered text, a row, a file.
- A test does not call the network, the database or the clock directly. Use the test doubles of the area.

## A test must be able to fail
- A test that passes before the code change proves nothing. Change it or delete it.
- A test that checks only a mock call proves the mock. Assert what the code returns or shows.
- Write the expected value by hand. Never compute it with the code under test.
- A test that asserts only a constant, `toBeDefined` or `not.toThrow` where a real value exists proves nothing.
- Never write a snapshot with `--update` before the code exists. Check the expected output by hand.
- `nook eng task prove <id> <T> --files <tests>` runs the new tests on the base: they must fail there.

## A failing test
- Find the cause before you change a test. Change a test only when the criterion changed.
- Never weaken a test to make it pass.
- Never skip, disable or comment out a test without the owner's approval. A test in a comment counts as a skipped test.
