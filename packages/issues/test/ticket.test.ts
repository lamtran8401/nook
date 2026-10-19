import { describe, expect, test } from 'bun:test'

import { headingOf, renderTicket, sectionsOf } from '../src/ticket.ts'

const TICKET = {
  key: 'GH-482',
  title: 'Filter orders by status',
  link: 'https://github.com/acme/shop/issues/482',
  fields: [['Source', 'https://github.com/acme/shop/issues/482'], ['Labels', 'feature, orders']] as [string, string][],
  description: 'The list is long.',
  sections: [{ use: 'acceptanceCriteria', text: '- A status filter.' }, { use: 'technicalSolution', text: 'A query parameter.' }],
  comments: [{ author: 'ana', at: '2026-10-11', body: 'Keep it after a reload?\nIn the address.' }],
}

describe('renderTicket', () => {
  test('writes the shape that each stage reads: Fields, Description, Acceptance criteria, each other use, Comments', () => {
    expect(renderTicket(TICKET)).toBe(
      '# GH-482: Filter orders by status\n\n' +
        '## Fields\n- Source: https://github.com/acme/shop/issues/482\n- Labels: feature, orders\n\n' +
        '## Description\nThe list is long.\n\n' +
        '## Acceptance criteria\n- A status filter.\n\n' +
        '## Technical solution\nA query parameter.\n\n' +
        '## Comments\n- ana on 2026-10-11:\n  Keep it after a reload?\n  In the address.\n',
    )
  })

  test('says so when the ticket has no acceptance criteria, no description or no comment', () => {
    const empty = renderTicket({ ...TICKET, description: '', sections: [{ use: 'acceptanceCriteria', text: null }], comments: [] })
    expect(empty).toContain('## Description\nNone in the ticket.\n')
    expect(empty).toContain('## Acceptance criteria\nNone in the ticket. /spec writes them with the owner.\n')
    expect(empty).toContain('## Comments\nNone.\n')
  })

  test('a heading in the words of the ticket sits two levels lower, so it never reads as a section of the ticket; a code fence keeps its lines', () => {
    const text = renderTicket({ ...TICKET, description: 'Words.\n\n## Notes\nLater.\n\n```md\n# not a heading\n```' })
    expect(text).toContain('## Description\nWords.\n\n#### Notes\nLater.\n\n```md\n# not a heading\n```\n')
    expect(Object.keys(sectionsOf(text))).toEqual(['Fields', 'Description', 'Acceptance criteria', 'Technical solution', 'Comments'])
  })

  test('a ticket with no map for the acceptance criteria still has the section', () => {
    expect(renderTicket({ ...TICKET, sections: [] })).toContain('## Acceptance criteria\nNone in the ticket. /spec writes them with the owner.\n')
  })
})

describe('headingOf and sectionsOf', () => {
  test('a use reads as words, the criteria with their fixed name', () => {
    expect(['acceptanceCriteria', 'technicalSolution', 'sprint'].map(headingOf)).toEqual(['Acceptance criteria', 'Technical solution', 'Sprint'])
  })

  test('a ticket file reads back as its sections, by heading', () => {
    expect(sectionsOf(renderTicket(TICKET))).toEqual({
      Fields: '- Source: https://github.com/acme/shop/issues/482\n- Labels: feature, orders',
      Description: 'The list is long.',
      'Acceptance criteria': '- A status filter.',
      'Technical solution': 'A query parameter.',
      Comments: '- ana on 2026-10-11:\n  Keep it after a reload?\n  In the address.',
    })
  })
})
