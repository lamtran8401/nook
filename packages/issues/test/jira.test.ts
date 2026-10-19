import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { existsSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { IssuesConfig } from '../src/config.ts'
import { readJira } from '../src/jira.ts'
import { pull } from '../src/pull.ts'
import { resolveRef } from '../src/ref.ts'

const SHOP_12 = readFileSync(join(import.meta.dirname, 'fixtures', 'shop-12.json'), 'utf8')
const JIRA = {
  type: 'jira' as const,
  site: 'company.atlassian.net',
  fields: { acceptanceCriteria: 'customfield_10095', technicalSolution: 'customfield_10096', sprint: 'customfield_10019' },
  projects: { PAY: { fields: { acceptanceCriteria: 'customfield_10210' } } },
}

describe('resolveRef for Jira', () => {
  test('a key of no GitHub prefix names the Jira source', () => {
    const config = IssuesConfig.from({ sources: [{ type: 'github', repo: 'acme/shop' }, JIRA] })
    expect(resolveRef('SHOP-12', config)).toMatchObject({ key: 'SHOP-12', source: { type: 'jira', site: 'company.atlassian.net' } })
  })

  test('with two Jira sites, the key takes the site whose map names its project', () => {
    const config = IssuesConfig.from({ sources: [{ type: 'jira', site: 'one.atlassian.net' }, { ...JIRA, site: 'two.atlassian.net' }] })
    expect(resolveRef('PAY-7', config)).toMatchObject({ source: { site: 'two.atlassian.net' } })
    expect(() => resolveRef('SHOP-1', config)).toThrow(expect.objectContaining({ message: 'SHOP-1 could come from two Jira sites: one.atlassian.net, two.atlassian.net' }))
  })
})

describe('readJira', () => {
  test('reads the work item with twg on the site of the source, and maps each use', () => {
    const ran: string[][] = []
    const read = readJira(JIRA, 'SHOP-12', argv => (ran.push(argv), { code: 0, out: SHOP_12, err: '' }))
    expect(ran).toEqual([['twg', '--site', 'company.atlassian.net', 'jira', 'workitem', 'get', 'SHOP-12', '--full', '-o', 'json']])
    expect(read.ticket.title).toBe('Refund to the same card')
    expect(read.ticket.link).toBe('https://company.atlassian.net/browse/SHOP-12')
    expect(read.ticket.description).toBe('A refund goes back to the card that paid.')
    expect(read.ticket.fields).toEqual([
      ['Source', 'https://company.atlassian.net/browse/SHOP-12'], ['Type', 'Story'], ['Status', 'To Do'], ['Priority', 'High'], ['Assignee', 'Lam'], ['Reporter', 'Dana'], ['Labels', 'payments'], ['Sprint', 'Sprint 12'],
    ])
    expect(read.ticket.sections).toEqual([
      { use: 'acceptanceCriteria', text: '- A refund of a card payment goes to that card.' },
      { use: 'technicalSolution', text: 'Call the refund API of the vault with the payment id.\nKeep the refund id on the order.' },
    ])
    expect(read.ticket.comments).toEqual([{ author: 'Ana', at: '2026-10-12', body: 'What about a card that expired?' }])
    expect(read.attachments.map(a => a.name)).toEqual(['flow.png', 'notes.pdf', 'demo.mov'])
    expect(read.missing).toEqual([])
  })

  test('a project with an override takes its own field for a use', () => {
    const pay = SHOP_12.replace('"SHOP-12"', '"PAY-7"').replace('customfield_10095', 'customfield_10210')
    expect(readJira(JIRA, 'PAY-7', () => ({ code: 0, out: pay, err: '' })).ticket.sections[0]).toEqual({ use: 'acceptanceCriteria', text: '- A refund of a card payment goes to that card.' })
  })

  test('a field of the map that the item lacks is named as missing', () => {
    const bare = JSON.stringify({ data: { ...JSON.parse(SHOP_12).data, customfield_10096: null } })
    expect(readJira(JIRA, 'SHOP-12', () => ({ code: 0, out: bare, err: '' })).missing).toEqual(['technicalSolution'])
  })

  test('reads custom fields under fields, and the items of a batch answer', () => {
    const { customfield_10095, ...rest } = JSON.parse(SHOP_12).data
    const nested = JSON.stringify({ data: { items: [{ data: { ...rest, fields: { customfield_10095 } } }] } })
    expect(readJira(JIRA, 'SHOP-12', () => ({ code: 0, out: nested, err: '' })).ticket.sections[0]!.text).toBe('- A refund of a card payment goes to that card.')
  })
})

describe('pull of a Jira ticket', () => {
  let home: string
  beforeEach(() => {
    home = realpathSync(mkdtempSync(join(tmpdir(), 'nook-issues-jira-')))
  })
  afterEach(() => rmSync(home, { recursive: true, force: true }))

  test('downloads each file of 10 MB or less into attachments/, and lists a larger one as a link', () => {
    const downloads: string[] = []
    const runner = (argv: string[]) => {
      if (argv.includes('get')) return { code: 0, out: SHOP_12, err: '' }
      if (argv.includes('download')) {
        const path = argv[argv.indexOf('--output-path') + 1]!
        downloads.push(`${argv[argv.indexOf('--attachment-id') + 1]} ${path.slice(home.length + 1)}`)
        writeFileSync(path, 'bytes')
      }
      return { code: 0, out: '', err: '' }
    }
    const [report] = pull({ home, config: IssuesConfig.from({ sources: [JIRA] }) }, ['SHOP-12'], runner)
    expect(downloads).toEqual(['10001 backlog/SHOP-12/attachments/flow.png', '10002 backlog/SHOP-12/attachments/notes.pdf'])
    expect(report).toMatchObject({ key: 'SHOP-12', status: 'new', attachments: 2, links: 1 })
    const ticket = readFileSync(join(home, 'backlog', 'SHOP-12', 'ticket.md'), 'utf8')
    expect(ticket).toContain('## Attachments\n- flow.png: attachments/flow.png\n- notes.pdf: attachments/notes.pdf\n- demo.mov (50 MB, too large to keep): https://company.atlassian.net/rest/api/3/attachment/content/10003\n')
    expect(existsSync(join(home, 'backlog', 'SHOP-12', 'attachments', 'flow.png'))).toBe(true)
  })

  test('a file name with a path keeps only its last part', () => {
    const odd = SHOP_12.replace('"flow.png"', '"../../evil.png"')
    const paths: string[] = []
    pull({ home, config: IssuesConfig.from({ sources: [JIRA] }) }, ['SHOP-12'], argv => {
      if (argv.includes('get')) return { code: 0, out: odd, err: '' }
      if (argv.includes('download')) paths.push(argv[argv.indexOf('--output-path') + 1]!.slice(home.length + 1))
      return { code: 0, out: '', err: '' }
    })
    expect(paths[0]).toBe('backlog/SHOP-12/attachments/evil.png')
  })

  test('with no twg login it stops with exit 3 and the fix', () => {
    const noLogin = (argv: string[]) => (argv.includes('whoami') || argv.includes('get') ? { code: 1, out: '', err: 'login' } : { code: 0, out: '', err: '' })
    expect(() => pull({ home, config: IssuesConfig.from({ sources: [JIRA] }) }, ['SHOP-12'], noLogin)).toThrow(expect.objectContaining({ code: 3, fix: 'twg login --site company.atlassian.net' }))
  })
})
