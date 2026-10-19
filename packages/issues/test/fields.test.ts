import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { IssuesConfig } from '../src/config.ts'
import { listFields } from '../src/fields.ts'

const SHOP_12 = readFileSync(join(import.meta.dirname, 'fixtures', 'shop-12.json'), 'utf8')
const GH_482 = readFileSync(join(import.meta.dirname, 'fixtures', 'gh-482.json'), 'utf8')
const METADATA = JSON.stringify({ data: { fields: [{ id: 'customfield_10095', name: 'Acceptance criteria' }, { fieldId: 'customfield_10096', name: 'Technical solution' }, { key: 'customfield_10019', name: 'Sprint' }] } })
const config = IssuesConfig.from({ sources: [{ type: 'jira', site: 'company.atlassian.net' }, { type: 'github', repo: 'acme/shop' }] })

describe('listFields', () => {
  test('lists each field of a Jira item with its id, its name from the metadata and the start of its value', () => {
    const ran: string[][] = []
    const rows = listFields('SHOP-12', config, argv => (ran.push(argv), { code: 0, out: argv.includes('update-metadata') ? METADATA : SHOP_12, err: '' }))
    expect(ran[1]).toEqual(['twg', '--site', 'company.atlassian.net', 'jira', 'workitem', 'field', 'update-metadata', '--id', 'SHOP-12', '-o', 'json'])
    expect(rows.filter(r => r.id.startsWith('customfield'))).toEqual([
      { id: 'customfield_10095', name: 'Acceptance criteria', start: '- A refund of a card payment goes to that card.' },
      { id: 'customfield_10096', name: 'Technical solution', start: 'Call the refund API of the vault with the payment id. Keep the r…' },
      { id: 'customfield_10019', name: 'Sprint', start: 'Sprint 12' },
    ])
    expect(rows.find(r => r.id === 'summary')).toEqual({ id: 'summary', name: 'summary', start: 'Refund to the same card' })
  })

  test('a field with no name in the metadata keeps its id as its name, and a field with no value is left out', () => {
    const rows = listFields('SHOP-12', config, argv => ({ code: 0, out: argv.includes('update-metadata') ? '{}' : SHOP_12, err: '' }))
    expect(rows.find(r => r.id === 'customfield_10019')).toEqual({ id: 'customfield_10019', name: 'customfield_10019', start: 'Sprint 12' })
  })

  test('lists each heading of a GitHub issue body with the start of its text', () => {
    expect(listFields('GH-482', config, () => ({ code: 0, out: GH_482, err: '' }))).toEqual([
      { id: '## Acceptance criteria', name: 'Acceptance criteria', start: '- The list shows a status filter. - An empty filter shows every …' },
      { id: '## Technical solution', name: 'Technical solution', start: 'A query parameter `status` on GET /orders.' },
      { id: '## Notes', name: 'Notes', start: 'The export comes later.' },
      { id: 'labels', name: 'labels', start: 'feature, orders' },
      { id: 'milestone', name: 'milestone', start: 'v2.1' },
    ])
  })
})
