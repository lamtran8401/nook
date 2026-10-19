import { describe, expect, test } from 'bun:test'

import { IssuesConfig } from '../src/config.ts'

describe('IssuesConfig', () => {
  test('reads a Jira and a GitHub source with their maps, and the backlog', () => {
    const config = IssuesConfig.from({
      backlog: 'tickets',
      sources: [
        { type: 'jira', site: 'company.atlassian.net', fields: { acceptanceCriteria: 'customfield_10095', sprint: 'customfield_10019' }, projects: { PAY: { fields: { acceptanceCriteria: 'customfield_10210' } } } },
        { type: 'github', repo: 'acme/shop', prefix: 'GH', sections: { acceptanceCriteria: 'Acceptance criteria' } },
      ],
    })
    expect(config.backlog).toBe('tickets')
    expect(config.sources).toEqual([
      { type: 'jira', site: 'company.atlassian.net', fields: { acceptanceCriteria: 'customfield_10095', sprint: 'customfield_10019' }, projects: { PAY: { fields: { acceptanceCriteria: 'customfield_10210' } } } },
      { type: 'github', repo: 'acme/shop', prefix: 'GH', sections: { acceptanceCriteria: 'Acceptance criteria' } },
    ])
    expect(config.missing).toBe(false)
  })

  test('takes the defaults: the backlog folder, the GH prefix, empty maps', () => {
    const config = IssuesConfig.from({ sources: [{ type: 'github', repo: 'acme/shop' }, { type: 'jira', site: 'company.atlassian.net' }] })
    expect(config.backlog).toBe('backlog')
    expect(config.sources).toEqual([
      { type: 'github', repo: 'acme/shop', prefix: 'GH', sections: {} },
      { type: 'jira', site: 'company.atlassian.net', fields: {}, projects: {} },
    ])
  })

  test('a desk with no section is missing, with no source', () => {
    expect(IssuesConfig.from(undefined)).toMatchObject({ missing: true, sources: [], backlog: 'backlog' })
  })

  test('a Jira map value that is no field id stops, with the key and the form of an id', () => {
    expect(() => IssuesConfig.from({ sources: [{ type: 'jira', site: 'company.atlassian.net', fields: { acceptanceCriteria: 'acceptance' } }] })).toThrow(
      expect.objectContaining({ message: 'nook.yml: issue-tracker.sources[0].fields.acceptanceCriteria is "acceptance", not a Jira field id', fix: 'write the id as customfield_<number>; nook issues fields <ref> lists the ids of a ticket' }),
    )
    expect(() => IssuesConfig.from({ sources: [{ type: 'jira', site: 'x.atlassian.net', projects: { PAY: { fields: { sprint: 'Sprint' } } } }] })).toThrow(expect.objectContaining({ message: 'nook.yml: issue-tracker.sources[0].projects.PAY.fields.sprint is "Sprint", not a Jira field id' }))
  })

  test('refuses a source with no known type, a GitHub source with no owner/name, and a Jira source with no site', () => {
    expect(() => IssuesConfig.from({ sources: [{ type: 'trello' }] })).toThrow(expect.objectContaining({ message: 'nook.yml: issue-tracker.sources[0].type must be jira or github' }))
    expect(() => IssuesConfig.from({ sources: [{ type: 'github', repo: 'shop' }] })).toThrow(expect.objectContaining({ message: 'nook.yml: issue-tracker.sources[0].repo must be owner/name, such as acme/shop' }))
    expect(() => IssuesConfig.from({ sources: [{ type: 'jira' }] })).toThrow(expect.objectContaining({ message: 'nook.yml: issue-tracker.sources[0].site must name the Jira site, such as company.atlassian.net' }))
  })

  test('a prefix is capital letters and digits', () => {
    expect(() => IssuesConfig.from({ sources: [{ type: 'github', repo: 'acme/shop', prefix: 'gh-' }] })).toThrow(expect.objectContaining({ message: 'nook.yml: issue-tracker.sources[0].prefix must be capital letters and digits, such as GH' }))
  })
})
