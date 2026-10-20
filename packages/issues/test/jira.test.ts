import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { IssuesConfig } from '../src/config.ts'
import { readJira } from '../src/jira.ts'
import { pull } from '../src/pull.ts'
import { resolveRef } from '../src/ref.ts'

const SHOP_12 = readFileSync(join(import.meta.dirname, 'fixtures', 'shop-12.json'), 'utf8')
const FILES = readFileSync(join(import.meta.dirname, 'fixtures', 'shop-12-attachments.json'), 'utf8')
const JSON_OUT = ['-o', 'json', '--output-summary', 'none']
/** A twg that answers the item and its files; each call goes into `ran`. */
const twg = (ran: string[][] = [], item = SHOP_12, files = FILES) => (argv: string[]) => {
  ran.push(argv)
  return { code: 0, out: argv.includes('attachment') ? files : item, err: '' }
}
const JIRA = {
  type: 'jira' as const,
  site: 'company.atlassian.net',
  fields: { acceptanceCriteria: 'customfield_10095', technicalSolution: 'customfield_10096', sprint: 'customfield_10019' },
  projects: { PAY: { fields: { acceptanceCriteria: 'customfield_10210' } } },
  kinds: {} as Record<string, string>,
  skip: [] as string[],
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
  test('reads the work item and its files with twg on the site of the source, the fields of the map by name, and maps each use', () => {
    const ran: string[][] = []
    const read = readJira(JIRA, 'SHOP-12', twg(ran))
    expect(ran).toEqual([
      ['twg', '--site', 'company.atlassian.net', 'jira', 'workitem', 'get', 'SHOP-12', '--full', '--field', 'customfield_10095', '--field', 'customfield_10096', '--field', 'customfield_10019', ...JSON_OUT],
      ['twg', '--site', 'company.atlassian.net', 'jira', 'workitem', 'attachment', 'query', '--issue-id', 'SHOP-12', ...JSON_OUT],
    ])
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
    expect(readJira(JIRA, 'PAY-7', twg([], pay)).ticket.sections[0]).toEqual({ use: 'acceptanceCriteria', text: '- A refund of a card payment goes to that card.' })
  })

  test('a field of the map that the item lacks is named as missing', () => {
    const bare = JSON.stringify({ data: { ...JSON.parse(SHOP_12).data, customfield_10096: null } })
    expect(readJira(JIRA, 'SHOP-12', twg([], bare)).missing).toEqual(['technicalSolution'])
  })

  test('reads custom fields under fields, and the items of a batch answer', () => {
    const { customfield_10095, ...rest } = JSON.parse(SHOP_12).data
    const nested = JSON.stringify({ data: { items: [{ data: { ...rest, fields: { customfield_10095 } } }] } })
    expect(readJira(JIRA, 'SHOP-12', twg([], nested)).ticket.sections[0]!.text).toBe('- A refund of a card payment goes to that card.')
  })

  test('reads the item of an answer whose data is a list', () => {
    const list = JSON.stringify({ data: [JSON.parse(SHOP_12).data] })
    expect(readJira(JIRA, 'SHOP-12', twg([], list)).ticket.title).toBe('Refund to the same card')
  })

  test('an answer with no work item stops and names its shape, never an empty ticket', () => {
    expect(() => readJira(JIRA, 'SHOP-12', twg([], '{"data":[]}'))).toThrow(expect.objectContaining({ message: 'twg gave no work item for SHOP-12: data is a list of 0' }))
    expect(() => readJira(JIRA, 'SHOP-12', twg([], '{"data":{"errors":[],"meta":{}}}'))).toThrow(expect.objectContaining({ message: 'twg gave no work item for SHOP-12: data has errors, meta' }))
    expect(() => readJira(JIRA, 'SHOP-12', twg([], '{"ok":true}'))).toThrow(expect.objectContaining({ message: 'twg gave no work item for SHOP-12: the answer has ok' }))
  })

  test('an item with another key stops the read', () => {
    expect(() => readJira(JIRA, 'SHOP-12', twg([], SHOP_12.replace('"SHOP-12"', '"SHOP-99"')))).toThrow(expect.objectContaining({ message: 'twg gave SHOP-99 when asked for SHOP-12' }))
  })

  test('with kinds, the kind of the ticket type is a row of Fields after the type, and the parent of the ticket is one too', () => {
    const child = JSON.stringify({ data: { ...JSON.parse(SHOP_12).data, parent: { key: 'SHOP-1', fields: { summary: 'Refunds' } } } })
    const read = readJira({ ...JIRA, kinds: { Story: 'feature' } }, 'SHOP-12', twg([], child))
    expect(read.ticket.fields.slice(1, 3)).toEqual([['Type', 'Story'], ['Kind', 'feature']])
    expect(read.ticket.fields).toContainEqual(['Parent', 'SHOP-1'])
  })

  test('a type in skip stops the pull: it has no local work in this desk', () => {
    expect(() => readJira({ ...JIRA, skip: ['Story'] }, 'SHOP-12', twg())).toThrow(expect.objectContaining({ code: 3, message: 'SHOP-12 is a Story: that type has no local work in this desk', fix: 'pull a ticket of another type, or take Story out of skip of the source in nook.yml' }))
  })

  test('with kinds, a type in neither kinds nor skip stops the pull with the fix', () => {
    expect(() => readJira({ ...JIRA, kinds: { Bug: 'fix' } }, 'SHOP-12', twg())).toThrow(expect.objectContaining({ code: 3, message: 'SHOP-12 is a Story, a type in neither kinds nor skip of the source', fix: 'add Story to kinds or to skip of the source in nook.yml' }))
  })

  test('takes the files from the attachment query, not from the item', () => {
    const one = JSON.stringify({ data: [JSON.parse(FILES).data[1]] })
    expect(readJira(JIRA, 'SHOP-12', twg([], SHOP_12, one)).attachments.map(a => a.name)).toEqual(['notes.pdf'])
  })

  test('an answer of twg that is not JSON stops with its first line', () => {
    const envelope = 'output_files:\n  - /tmp/twg/out-1.json\nstats: { bytes: 90210 }\n'
    expect(() => readJira(JIRA, 'SHOP-12', twg([], envelope))).toThrow(expect.objectContaining({ message: 'twg gave no JSON for SHOP-12: output_files:' }))
  })

  test('an Epic is not pulled: the error lists its stories', () => {
    const epic = SHOP_12.replace('"Story"', '"Epic"')
    const stories = JSON.stringify({ data: { issues: [{ key: 'SHOP-13', summary: 'Filter by status' }, { key: 'SHOP-14', summary: 'Export the list' }] } })
    const ran: string[][] = []
    const runner = (argv: string[]) => (ran.push(argv), { code: 0, out: argv.includes('query') ? stories : epic, err: '' })
    expect(() => readJira(JIRA, 'SHOP-12', runner)).toThrow(expect.objectContaining({ code: 3, message: 'SHOP-12 is an Epic, not a work item. Its stories: SHOP-13 Filter by status, SHOP-14 Export the list', fix: 'pull one story, such as nook issues pull SHOP-13' }))
    expect(ran[1]).toEqual(['twg', '--site', 'company.atlassian.net', 'jira', 'workitem', 'query', '--jql', 'parent = SHOP-12', ...JSON_OUT])
  })

  test('an Epic with no story says so', () => {
    const epic = SHOP_12.replace('"Story"', '"Epic"')
    const runner = (argv: string[]) => ({ code: 0, out: argv.includes('query') ? '{"data":{"issues":[]}}' : epic, err: '' })
    expect(() => readJira(JIRA, 'SHOP-12', runner)).toThrow(expect.objectContaining({ code: 3, message: 'SHOP-12 is an Epic, not a work item, and it has no story', fix: 'pull a story or a task of the Epic' }))
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
      if (argv.includes('query')) return { code: 0, out: FILES, err: '' }
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
    const odd = FILES.replace('"flow.png"', '"../../evil.png"')
    const paths: string[] = []
    pull({ home, config: IssuesConfig.from({ sources: [JIRA] }) }, ['SHOP-12'], argv => {
      if (argv.includes('get')) return { code: 0, out: SHOP_12, err: '' }
      if (argv.includes('query')) return { code: 0, out: odd, err: '' }
      if (argv.includes('download')) paths.push(argv[argv.indexOf('--output-path') + 1]!.slice(home.length + 1))
      return { code: 0, out: '', err: '' }
    })
    expect(paths[0]).toBe('backlog/SHOP-12/attachments/evil.png')
  })

  test('a file already in attachments/ is kept as it is and not downloaded again', () => {
    const folder = join(home, 'backlog', 'SHOP-12', 'attachments')
    mkdirSync(folder, { recursive: true })
    writeFileSync(join(folder, 'flow.png'), 'the owner\'s own file')
    const downloads: string[] = []
    const [report] = pull({ home, config: IssuesConfig.from({ sources: [JIRA] }) }, ['SHOP-12'], argv => {
      if (argv.includes('get')) return { code: 0, out: SHOP_12, err: '' }
      if (argv.includes('query')) return { code: 0, out: FILES, err: '' }
      if (argv.includes('download')) downloads.push(argv[argv.indexOf('--attachment-id') + 1]!)
      return { code: 0, out: '', err: '' }
    })
    expect(downloads).toEqual(['10002'])
    expect(readFileSync(join(folder, 'flow.png'), 'utf8')).toBe('the owner\'s own file')
    expect(report).toMatchObject({ attachments: 2, links: 1 })
  })

  test('with no twg login it stops with exit 3 and the fix', () => {
    const noLogin = (argv: string[]) => (argv.includes('whoami') || argv.includes('get') ? { code: 1, out: '', err: 'login' } : { code: 0, out: '', err: '' })
    expect(() => pull({ home, config: IssuesConfig.from({ sources: [JIRA] }) }, ['SHOP-12'], noLogin)).toThrow(expect.objectContaining({ code: 3, fix: 'twg login --site company.atlassian.net' }))
  })
})
