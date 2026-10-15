import { describe, expect, test } from 'bun:test'

import { dependsCycle, TasksDocument } from '../src/documents/tasks.ts'

describe('TasksDocument', () => {
  test('reads sections, fields in any case, lists with commas or spaces, and names the problems', () => {
    const parsed = TasksDocument.parse('# t\n\n## T1: the test\n\n- area: bff\n- depends: none\n- acs: 1, 2\n- size: s\n- done when: it passes\n- proof: none (a config change)\n\n## T2: the fix\n\nArea: web\nDepends: T1 T3\nacs: AC1\nsize: XL\n')
    expect(parsed.slices[0]).toMatchObject({ id: 'T1', title: 'the test', area: 'bff', depends: [], acs: [1, 2], size: 'S', doneWhen: 'it passes', proof: 'none (a config change)' })
    expect(parsed.slices[1]).toMatchObject({ id: 'T2', area: 'web', depends: ['T1', 'T3'], acs: [1], size: null })
    expect(parsed.problems).toEqual(['T2: size "XL" is not S, M or L', 'T2: depends names T3, which is not a slice'])
    expect(dependsCycle([{ id: 'T1', depends: ['T2'] }, { id: 'T2', depends: ['T1'] }])).toEqual(['T1', 'T2', 'T1'])
    expect(dependsCycle([{ id: 'T1', depends: [] }, { id: 'T2', depends: ['T1'] }])).toBeNull()
  })
})
