import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { readGitHub } from '../src/github.ts'
import { resolveRef } from '../src/ref.ts'
import { IssuesConfig } from '../src/config.ts'

const GH_482 = readFileSync(join(import.meta.dirname, 'fixtures', 'gh-482.json'), 'utf8')
const SOURCE = { type: 'github' as const, repo: 'acme/shop', prefix: 'GH', sections: { acceptanceCriteria: 'Acceptance criteria', technicalSolution: 'Technical solution' } }

describe('resolveRef', () => {
  const config = IssuesConfig.from({ sources: [SOURCE, { type: 'github', repo: 'acme/web', prefix: 'WEB' }] })

  test('a prefix and a number, or owner/name#number, name a GitHub issue and the item it makes', () => {
    expect(resolveRef('GH-482', config)).toMatchObject({ key: 'GH-482', number: 482, source: { repo: 'acme/shop' } })
    expect(resolveRef('acme/web#9', config)).toMatchObject({ key: 'WEB-9', number: 9, source: { repo: 'acme/web' } })
  })

  test('a ref of no source of the workspace stops with the forms that work', () => {
    expect(() => resolveRef('other/repo#1', config)).toThrow(expect.objectContaining({ message: 'other/repo#1 names no source of this workspace', fix: 'use a Jira key such as SHOP-12, a prefix such as GH-482, or a repo of issue-tracker.sources, such as acme/shop#482' }))
    expect(() => resolveRef('482', config)).toThrow(expect.objectContaining({ message: '482 names no source of this workspace' }))
  })
})

describe('readGitHub', () => {
  test('reads the issue with gh as JSON, the body split by the heading of each use', () => {
    const ran: string[][] = []
    const read = readGitHub(SOURCE, 482, argv => (ran.push(argv), { code: 0, out: GH_482, err: '' }))
    expect(ran).toEqual([['gh', 'issue', 'view', '482', '--repo', 'acme/shop', '--json', 'number,title,url,state,author,createdAt,labels,milestone,assignees,body,comments']])
    expect(read.ticket).toEqual({
      key: 'GH-482',
      title: 'Filter orders by status',
      link: 'https://github.com/acme/shop/issues/482',
      fields: [['Source', 'https://github.com/acme/shop/issues/482'], ['State', 'open'], ['Author', 'dana'], ['Labels', 'feature, orders'], ['Milestone', 'v2.1'], ['Assignees', 'lam']],
      description: 'The list of orders is long. A person wants to see only the orders in one status.\n\n## Notes\nThe export comes later.',
      sections: [
        { use: 'acceptanceCriteria', text: '- The list shows a status filter.\n- An empty filter shows every order.' },
        { use: 'technicalSolution', text: 'A query parameter `status` on GET /orders.' },
      ],
      comments: [
        { author: 'ana', at: '2026-10-11', body: 'Must the filter keep its value after a reload?' },
        { author: 'dana', at: '2026-10-11', body: 'Yes, in the address.\nAs ?status=paid.' },
      ],
    })
    expect(read.missing).toEqual([])
  })

  test('a heading of the map that the body does not have is named as missing; an issue with no label or milestone leaves those rows out', () => {
    const bare = JSON.stringify({ ...JSON.parse(GH_482), body: 'Only words.', labels: [], milestone: null, assignees: [], comments: [] })
    const read = readGitHub(SOURCE, 482, () => ({ code: 0, out: bare, err: '' }))
    expect(read.missing).toEqual(['acceptanceCriteria', 'technicalSolution'])
    expect(read.ticket.sections).toEqual([{ use: 'acceptanceCriteria', text: null }, { use: 'technicalSolution', text: null }])
    expect(read.ticket.fields.map(([name]) => name)).toEqual(['Source', 'State', 'Author'])
  })

  test('a heading matches at any level and with any case', () => {
    const body = JSON.stringify({ ...JSON.parse(GH_482), body: 'Words.\n\n### acceptance CRITERIA\n- one\n\n# Next\nmore' })
    expect(readGitHub(SOURCE, 482, () => ({ code: 0, out: body, err: '' })).ticket.sections[0]).toEqual({ use: 'acceptanceCriteria', text: '- one' })
  })
})
