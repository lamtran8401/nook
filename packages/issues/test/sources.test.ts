import { describe, expect, test } from 'bun:test'

import type { CommandRun } from '@nook/shared/run.ts'

import { checkSource } from '../src/sources.ts'

const GITHUB = { type: 'github' as const, repo: 'acme/shop', prefix: 'GH', sections: {} }
const JIRA = { type: 'jira' as const, site: 'company.atlassian.net', fields: {}, projects: {}, kinds: {}, skip: [] }

/** A runner that answers each command by its first words, and keeps each command that it ran. */
function runner(answers: Record<string, CommandRun>) {
  const ran: string[] = []
  const run = (argv: string[]) => {
    ran.push(argv.join(' '))
    const key = Object.keys(answers).find(k => argv.join(' ').startsWith(k))
    return key ? answers[key]! : { code: 0, out: '', err: '' }
  }
  return { run, ran }
}

describe('checkSource', () => {
  test('a source whose tool has a login works', () => {
    const r = runner({})
    expect(checkSource(GITHUB, r.run)).toEqual({ label: 'github acme/shop', tool: 'gh', ok: true })
    expect(r.ran).toEqual(['gh --version', 'gh auth status --hostname github.com'])
  })

  test('the login of Jira is checked on the site of the source', () => {
    const r = runner({})
    expect(checkSource(JIRA, r.run)).toEqual({ label: 'jira company.atlassian.net', tool: 'twg', ok: true })
    expect(r.ran).toEqual(['twg --version', 'twg --site company.atlassian.net whoami'])
  })

  test('a tool that is not on the path is a gap with its install', () => {
    const r = runner({ 'gh --version': { code: 1, out: '', err: 'spawnSync gh ENOENT' } })
    expect(checkSource(GITHUB, r.run)).toEqual({ label: 'github acme/shop', tool: 'gh', ok: false, problem: 'gh is not on the path', fix: 'install the GitHub CLI: brew install gh' })
  })

  test('a tool with no login is a gap with the command that logs in', () => {
    expect(checkSource(GITHUB, runner({ 'gh auth': { code: 1, out: '', err: 'not logged in' } }).run)).toMatchObject({ ok: false, problem: 'gh has no login for github.com', fix: 'gh auth login' })
    expect(checkSource(JIRA, runner({ 'twg --site': { code: 1, out: '', err: 'no auth' } }).run)).toMatchObject({ ok: false, problem: 'twg has no login for company.atlassian.net', fix: 'twg login --site company.atlassian.net' })
  })
})
