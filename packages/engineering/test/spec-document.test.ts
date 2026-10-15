import { describe, expect, test } from 'bun:test'

import { SpecDocument } from '../src/documents/spec.ts'
import { SPEC } from './helpers.ts'

describe('SpecDocument', () => {
  test('front matter, sections, AC lines with their tags, areas as a list or a comma list, problems', () => {
    const spec = SpecDocument.parse(SPEC({ areas: ['bff', 'web'] }))
    expect(spec).toMatchObject({ kind: 'feature', size: 'S', areas: ['bff', 'web'], intent: 'Fix the export date.', problems: [] })
    expect(spec.criteria.map(c => [c.n, c.tag, c.text])).toEqual([[1, 'ADD', '[ADD] the export has the right date'], [2, 'CHANGE', '[CHANGE] the error shows a reason']])
    expect(SpecDocument.parse(SPEC().replace('areas: [bff]', 'areas: bff, web')).areas).toEqual(['bff', 'web'])
    expect(SpecDocument.parse(SPEC().replace('areas: [bff]', 'areas:\n  - bff\n  - web')).areas).toEqual(['bff', 'web'])
    const bad = SpecDocument.parse('# no front matter\n\n## Acceptance criteria\n\n- the date is right\n- [FIX] x\n')
    expect(bad.problems).toContain('no front matter: start the file with --- id, kind, size, areas ---')
    expect(bad.problems).toContain('front matter: kind is missing')
    expect(bad.problems).toContain('write the Intent')
    expect(bad.problems.some(p => p.includes('"- the date is right" is not a'))).toBe(true)
    expect(bad.criteria).toEqual([])
    expect(SpecDocument.parse(SPEC({ kind: 'investigate', questions: ['why?', 'how?'] })).questions).toEqual(['why?', 'how?'])
  })

  test('withCriterion adds the line at the end of the criteria, before the next section', () => {
    const text = SpecDocument.withCriterion('## Acceptance criteria\n\n- [ADD] one\n\n## Out of scope\n\nNothing.\n', '[ADD] two')
    expect(text).toBe('## Acceptance criteria\n\n- [ADD] one\n- [ADD] two\n\n## Out of scope\n\nNothing.\n')
  })

  test('withCriterion gives null when the spec has no criteria section', () => {
    expect(SpecDocument.withCriterion('## Questions\n\n- why?\n', '[ADD] two')).toBeNull()
  })
})
