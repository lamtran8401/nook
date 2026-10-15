import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { EvError, Exit } from '@kit/shared/errors.ts'

import { Home } from '../src/home.ts'
import { makeHome, type TestHome } from './helpers.ts'

let t: TestHome
beforeEach(() => {
  t = makeHome()
})
afterEach(() => t.cleanup())

const caught = (work: () => unknown): EvError => {
  try {
    work()
  } catch (error) {
    return error as EvError
  }
  throw new Error('expected a failure')
}

describe('Home', () => {
  test('find returns the environment that turns the pack on, from a folder below it', () => {
    const home = Home.find(t.area('bff'))
    expect(home?.dir).toBe(t.root)
    expect(home?.dbFile).toBe(join(t.root, '.kit', 'engineering.db'))
    expect(home?.workDir('SHOP-1')).toBe(join(t.root, 'work', 'SHOP-1'))
    expect(home?.backlogDir('SHOP-1')).toBe(join(t.root, 'backlog', 'SHOP-1'))
    expect(home?.adrDir).toBe(join(t.root, 'docs', 'adr'))
  })

  test('require outside a home exits 1 and names kit init as the fix', () => {
    const outside = makeHome()
    writeFileSync(join(outside.root, 'kit.yml'), 'packs: []\n')
    try {
      const error = caught(() => Home.require(outside.root))
      expect(error.code).toBe(Exit.error)
      expect(error.fix).toContain('kit init --pack engineering')
    } finally {
      outside.cleanup()
    }
  })

  test('areaOf picks the deepest area that holds the file', () => {
    writeFileSync(join(t.root, 'kit.yml'), `packs: [engineering]
engineering:
  areas:
    - { name: shop, path: projects, kind: tool }
    - { name: bff, path: projects/bff, kind: backend }
`)
    const home = Home.find(t.root)!
    expect(home.areaOf(join(t.root, 'projects/bff/src/a.ts'))?.name).toBe('bff')
    expect(home.areaOf(join(t.root, 'projects/web/a.ts'))?.name).toBe('shop')
    expect(home.areaOf(join(t.root, 'README.md'))).toBeUndefined()
  })

  test('areaNamed refuses an unknown area and lists the areas that exist', () => {
    const error = caught(() => t.home.areaNamed('ghost'))
    expect(error.code).toBe(Exit.refused)
    expect(error.message).toBe('area ghost is not in kit.yml')
    expect(error.fix).toBe('areas that exist: bff, web; add it with /setup')
  })

  test('fileInArea takes a path from the area or from the home, and refuses one outside the area', () => {
    const bff = t.home.areaNamed('bff')
    mkdirSync(join(t.area('bff'), 'src'), { recursive: true })
    writeFileSync(join(t.area('bff'), 'src', 'a.ts'), '')
    expect(t.home.fileInArea(bff, 'src/a.ts')).toBe('src/a.ts')
    expect(t.home.fileInArea(bff, 'projects/bff/src/a.ts')).toBe('src/a.ts')
    const error = caught(() => t.home.fileInArea(bff, '/etc/hosts'))
    expect(error.message).toBe('file /etc/hosts is outside area bff')
  })
})
