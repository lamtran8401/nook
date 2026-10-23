import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { existsSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { issuesModule, issuesDoctor } from '../src/module.ts'

let root: string
beforeEach(() => {
  root = realpathSync(mkdtempSync(join(tmpdir(), 'nook-issues-module-')))
})
afterEach(() => rmSync(root, { recursive: true, force: true }))

const yml = (text: string) => writeFileSync(join(root, 'nook.yml'), text)
const working = () => ({ code: 0, out: '', err: '' })

describe('issuesModule', () => {
  test('with no section, the pack is not configured and the doctor names the fix', () => {
    yml('issue-tracker: {}\n')
    expect(issuesModule.configured(root)).toBe(false)
    expect(issuesDoctor(root, working).map(f => [f.level, f.text, f.fix])).toEqual([['warn', 'nook.yml has no issue-tracker section with the sources', 'write it with /setup']])
  })

  test('setup makes the backlog folder of the tickets', () => {
    yml('issue-tracker:\n  sources:\n    - { type: github, repo: acme/shop }\n')
    expect(issuesModule.setup(root)).toEqual(['backlog/'])
    expect(existsSync(join(root, 'backlog'))).toBe(true)
  })

  test('the doctor gives each source that works, and each gap with its fix', () => {
    yml('issue-tracker:\n  sources:\n    - { type: github, repo: acme/shop }\n    - { type: jira, site: company.atlassian.net }\n')
    const noTwg = (argv: string[]) => (argv[0] === 'twg' ? { code: 1, out: '', err: 'spawnSync twg ENOENT' } : working())
    expect(issuesDoctor(root, noTwg).map(f => [f.level, f.text, f.fix])).toEqual([
      ['ok', 'github acme/shop: gh has a login', undefined],
      ['error', 'jira company.atlassian.net: twg is not on the path', 'install the twg CLI of Atlassian Teamwork Graph, then twg login'],
    ])
  })

  test('a broken section is one error with the fix of the config', () => {
    yml('issue-tracker:\n  sources:\n    - { type: jira, site: company.atlassian.net, fields: { acceptanceCriteria: acceptance } }\n')
    expect(issuesDoctor(root, working).map(f => [f.level, f.text])).toEqual([['error', 'nook.yml: issue-tracker.sources[0].fields.acceptanceCriteria is "acceptance", not a Jira field id']])
  })

  test('a section with no source is a gap', () => {
    yml('issue-tracker:\n  sources: []\n')
    expect(issuesDoctor(root, working).map(f => [f.level, f.text, f.fix])).toEqual([['warn', 'issue-tracker has no source', 'add a jira or github source to issue-tracker.sources with /setup']])
  })

  test('a desk that does not turn the pack on gets nothing', () => {
    yml('wiki: {}\n')
    expect(issuesDoctor(root, working)).toEqual([])
  })
})
