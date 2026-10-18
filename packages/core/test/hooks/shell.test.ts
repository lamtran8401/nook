import { describe, expect, test } from 'bun:test'

import { commandOnly, shellWords } from '../../src/hooks/shell.ts'

describe('commandOnly', () => {
  test('drops heredoc bodies and comments, and keeps the commands', () => {
    expect(commandOnly("cat > a <<'EOF'\nbody .env\nEOF\nls # note .env\ncat .env")).toBe("cat > a <<'EOF'\nls\ncat .env")
  })
})

describe('shellWords', () => {
  test('joins a quoted word, and splits on operators outside quotes', () => {
    expect(shellWords(`grep -e 'a|b' f && echo "x; y"|wc`)).toEqual(['grep', '-e', 'a|b', 'f', 'echo', 'x; y', 'wc'])
  })

  test('adds the words of a $(...) substitution, also inside double quotes', () => {
    expect(shellWords('echo "$(date -u)"')).toEqual(['echo', 'date', '-u'])
  })

  test('adds the words of a backtick substitution', () => {
    expect(shellWords('echo `id -u`')).toEqual(['echo', 'id', '-u'])
  })

  test('keeps a $(...) inside single quotes as text', () => {
    expect(shellWords("echo '$(id)'")).toEqual(['echo', '$(id)'])
  })

  test('adds the words of the script of sh -c', () => {
    expect(shellWords('bash -lc "cd x && pwd"')).toEqual(['bash', '-lc', 'cd x && pwd', 'cd', 'x', 'pwd'])
  })

  test('adds the words that eval runs', () => {
    expect(shellWords('eval "ls -a"')).toEqual(['eval', 'ls -a', 'ls', '-a'])
  })
})
