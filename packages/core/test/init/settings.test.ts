import { describe, expect, test } from 'bun:test'

import { commandRules, dropRules, mergeSettings } from '../../src/init/settings.ts'

describe('mergeSettings', () => {
  test('permission lists join in order with no doubles', () => {
    const merged = mergeSettings({ permissions: { allow: ['a'] } }, { permissions: { allow: ['a', 'b'], deny: ['c'] } })
    expect(merged.permissions).toEqual({ allow: ['a', 'b'], ask: [], deny: ['c'] })
  })

  test('a key that the owner set keeps its value; a key that the owner did not set comes from the nook', () => {
    expect(mergeSettings({ theme: 'dark' }, { theme: 'light', outputStyle: 'x' })).toEqual({ theme: 'dark', outputStyle: 'x' })
  })

  test('env merges by variable across fragments, and the value of the owner wins', () => {
    const once = mergeSettings({ env: { MINE: '1' } }, { env: { A: '1', MINE: '2' } })
    expect(mergeSettings(once, { env: { B: '1' } }).env).toEqual({ A: '1', MINE: '1', B: '1' })
  })
})

describe('commandRules', () => {
  test('a command becomes a Bash rule that matches it and its arguments; a rule stays as written', () => {
    expect(commandRules({ allow: ['gh pr create', 'Read(docs/**)'], ask: ['git push'], deny: [] })).toEqual({
      allow: ['Bash(gh pr create*)', 'Read(docs/**)'],
      ask: ['Bash(git push*)'],
      deny: [],
    })
  })
})

describe('dropRules', () => {
  test('takes out the rules that nook wrote before and wants no more, and keeps every other rule', () => {
    const settings = { permissions: { allow: ['Bash(gh pr view*)', 'Bash(make *)'], ask: ['Bash(git push*)'] }, theme: 'dark' }
    const dropped = dropRules(settings, { allow: ['Bash(gh pr view*)'], ask: ['Bash(git push*)'], deny: [] }, { allow: [], ask: ['Bash(git push*)'], deny: [] })
    expect(dropped).toEqual({ permissions: { allow: ['Bash(make *)'], ask: ['Bash(git push*)'] }, theme: 'dark' })
  })
})
