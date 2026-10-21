import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { projectRoot } from '@nook/desk/project.ts'
import { uiKit } from '@nook/desk/ui-kit.ts'

let layer: string | null = null

/**
 * The styles that a page inlines, in order: the Bench kit, then the v2 layer of `packages/ui`. Next.js puts its own
 * stylesheet before both, so only this order lets the layer win each tie with a token of Bench.
 */
export function pageStyles(): [kit: string, layer: string] {
  layer ??= readFileSync(join(projectRoot(), 'packages', 'ui', 'src', 'styles', 'v2.css'), 'utf8')
  return [uiKit().css, layer]
}
