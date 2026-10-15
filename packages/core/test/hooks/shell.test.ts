import { describe, expect, test } from 'bun:test'

import { commandOnly } from '../../src/hooks/shell.ts'

describe('commandOnly', () => {
  test('drops heredoc bodies and comments, and keeps the commands', () => {
    expect(commandOnly("cat > a <<'EOF'\nbody .env\nEOF\nls # note .env\ncat .env")).toBe("cat > a <<'EOF'\nls\ncat .env")
  })
})
