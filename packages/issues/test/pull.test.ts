import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { IssuesConfig } from '../src/config.ts'
import { pull } from '../src/pull.ts'

const GH_482 = readFileSync(join(import.meta.dirname, 'fixtures', 'gh-482.json'), 'utf8')
const config = IssuesConfig.from({ sources: [{ type: 'github', repo: 'acme/shop', sections: { acceptanceCriteria: 'Acceptance criteria', technicalSolution: 'Technical solution' } }] })

let home: string
beforeEach(() => {
  home = realpathSync(mkdtempSync(join(tmpdir(), 'nook-issues-pull-')))
})
afterEach(() => rmSync(home, { recursive: true, force: true }))

const answer = (out: string) => (argv: string[]) => (argv[1] === 'issue' ? { code: 0, out, err: '' } : { code: 0, out: '', err: '' })
const ticketFile = () => join(home, 'backlog', 'GH-482', 'ticket.md')

describe('pull', () => {
  test('writes backlog/<KEY>/ticket.md and reports the key, the title, the link and that the ticket is new', () => {
    const [report] = pull({ home, config }, ['GH-482'], answer(GH_482))
    expect(report).toEqual({ key: 'GH-482', title: 'Filter orders by status', link: 'https://github.com/acme/shop/issues/482', file: 'backlog/GH-482/ticket.md', status: 'new', changed: [], missing: [], criteria: true, attachments: 0, links: 0 })
    expect(readFileSync(ticketFile(), 'utf8')).toStartWith('# GH-482: Filter orders by status\n\n## Fields\n')
  })

  test('a second pull writes the new text and names each section that changed', () => {
    pull({ home, config }, ['GH-482'], answer(GH_482))
    const changed = JSON.stringify({ ...JSON.parse(GH_482), body: JSON.parse(GH_482).body.replace('The list shows a status filter.', 'The list shows a filter of each status.') })
    const [report] = pull({ home, config }, ['acme/shop#482'], answer(changed))
    expect(report).toMatchObject({ status: 'updated', changed: ['Acceptance criteria'] })
    expect(readFileSync(ticketFile(), 'utf8')).toContain('- The list shows a filter of each status.')
  })

  test('a pull with no change says the ticket is the same', () => {
    pull({ home, config }, ['GH-482'], answer(GH_482))
    expect(pull({ home, config }, ['GH-482'], answer(GH_482))[0]).toMatchObject({ status: 'same', changed: [] })
  })

  test('a ticket with no acceptance criteria is still pulled, and the report says it has none', () => {
    const bare = JSON.stringify({ ...JSON.parse(GH_482), body: 'Only words.' })
    expect(pull({ home, config }, ['GH-482'], answer(bare))[0]).toMatchObject({ criteria: false, missing: ['acceptanceCriteria', 'technicalSolution'] })
    expect(readFileSync(ticketFile(), 'utf8')).toContain('## Acceptance criteria\nNone in the ticket.')
  })

  test('with no gh login it stops with exit 3 and the fix, and writes nothing', () => {
    const noLogin = (argv: string[]) => (argv[1] === 'auth' ? { code: 1, out: '', err: 'not logged in' } : argv[1] === 'issue' ? { code: 1, out: '', err: 'gh auth login' } : { code: 0, out: '', err: '' })
    expect(() => pull({ home, config }, ['GH-482'], noLogin)).toThrow(expect.objectContaining({ code: 3, message: 'github acme/shop: gh has no login for github.com', fix: 'gh auth login' }))
  })

  test('an issue that gh cannot read stops with its first lines', () => {
    const missing = (argv: string[]) => (argv[1] === 'issue' ? { code: 1, out: '', err: 'GraphQL: Could not resolve to an issue with the number of 999.' } : { code: 0, out: '', err: '' })
    expect(() => pull({ home, config }, ['GH-999'], missing)).toThrow(expect.objectContaining({ message: 'gh could not read GH-999: GraphQL: Could not resolve to an issue with the number of 999.' }))
  })

  test('the tickets go to the backlog folder of the section', () => {
    const elsewhere = IssuesConfig.from({ backlog: 'tickets', sources: [{ type: 'github', repo: 'acme/shop' }] })
    expect(pull({ home, config: elsewhere }, ['GH-482'], answer(GH_482))[0]!.file).toBe('tickets/GH-482/ticket.md')
  })
})
