import { describe, expect, test } from 'bun:test'

import { commandNames, commandOnly } from '../../src/hooks/shell.ts'

describe('commandOnly', () => {
  test('drops heredoc bodies and comments, and keeps the commands', () => {
    expect(commandOnly("cat > a <<'EOF'\nbody .env\nEOF\nls # note .env\ncat .env")).toBe("cat > a <<'EOF'\nls\ncat .env")
  })
})

describe('commandNames', () => {
  test('gives the program of each command between ;, |, && and new lines', () => {
    expect(commandNames('cd src && ls -la | wc -l; git status\nbun test')).toEqual(['cd', 'ls', 'wc', 'git', 'bun'])
  })

  test('keeps an operator inside quotes as part of the word', () => {
    expect(commandNames(`grep -e 'a|b' f && echo "x; y"`)).toEqual(['grep', 'echo'])
  })

  test('steps past wrappers and assignments to the program they run', () => {
    expect(commandNames('X=1 Y=2 sudo env nohup git log')).toEqual(['git'])
  })

  test('steps past a wrapper named by its path, and keeps the path of the program', () => {
    expect(commandNames('/usr/bin/env /opt/bin/python3 a.py')).toEqual(['/opt/bin/python3'])
  })
})
