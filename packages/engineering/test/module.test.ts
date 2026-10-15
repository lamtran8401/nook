import { afterEach, describe, expect, test } from 'bun:test'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { engineeringModule } from '../src/module.ts'
import { makeHome, type TestHome } from './helpers.ts'

let t: TestHome
afterEach(() => t.cleanup())

const clearFolders = () => {
  for (const folder of ['work', 'backlog', 'docs/adr']) rmSync(join(t.root, folder), { recursive: true, force: true })
}

describe('engineeringModule', () => {
  test('setup makes work/, backlog/ and docs/adr/ in its home and names each one', () => {
    t = makeHome()
    clearFolders()
    expect(engineeringModule.setup(t.root)).toEqual(['work/', 'backlog/', 'docs/adr/'])
    expect(['work', 'backlog', 'docs/adr'].map(f => existsSync(join(t.root, f)))).toEqual([true, true, true])
  })

  test('a second setup makes nothing', () => {
    t = makeHome()
    engineeringModule.setup(t.root)
    expect(engineeringModule.setup(t.root)).toEqual([])
  })

  test('setup in a child folder does not touch the home of its parent', () => {
    t = makeHome()
    clearFolders()
    const child = join(t.root, 'projects', 'notes')
    mkdirSync(child, { recursive: true })
    writeFileSync(join(child, 'kit.yml'), 'packs: []\n')
    expect(engineeringModule.setup(child)).toEqual([])
    expect(existsSync(join(t.root, 'work'))).toBe(false)
  })

  test('a home with no engineering section in kit.yml is not configured', () => {
    t = makeHome({ section: false })
    expect(engineeringModule.configured(t.root)).toBe(false)
  })

  test('a home with its areas in kit.yml is configured', () => {
    t = makeHome()
    expect(engineeringModule.configured(t.root)).toBe(true)
  })

  test('doctor names a missing folder with the fix to run kit init --update', () => {
    t = makeHome()
    clearFolders()
    expect(engineeringModule.doctor(t.root)).toContainEqual({ level: 'warn', where: t.root, text: 'work/ is missing', fix: 'kit init --update' })
  })
})
