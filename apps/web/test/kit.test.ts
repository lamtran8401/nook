import { expect, test } from 'bun:test'

import { pageStyles } from '@/lib/kit.ts'

test('a page inlines the Bench kit first and the v3 layer after it, so the layer wins each tie with a Bench token', () => {
  const [kit, layer] = pageStyles()
  expect(kit).toContain('.bn-root')
  expect(layer).toContain('--bg: #f6f6f4;')
  expect(pageStyles()).toHaveLength(2)
})
