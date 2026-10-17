import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { DeskList } from '../src/desk-list.ts'

let root: string
beforeEach(() => {
  root = realpathSync(mkdtempSync(join(tmpdir(), 'nook-list-')))
})
afterEach(() => rmSync(root, { recursive: true, force: true }))

const folder = (name: string) => {
  const dir = join(root, name)
  mkdirSync(dir, { recursive: true })
  return dir
}

describe('DeskList', () => {
  test('adds a folder once, in the order of the first add, and writes one path on each line', () => {
    const file = join(root, 'config', 'nook', 'desks')
    const list = new DeskList(file)
    const personal = folder('personal')
    const company = folder('company')
    list.add(personal)
    list.add(company)
    list.add(personal)
    expect(list.dirs()).toEqual([personal, company])
    expect(readFileSync(file, 'utf8')).toBe(`${personal}\n${company}\n`)
  })

  test('drops a folder that no longer exists, and writes the list without it', () => {
    const file = join(root, 'desks')
    const list = new DeskList(file)
    const kept = folder('kept')
    const gone = folder('gone')
    list.add(kept)
    list.add(gone)
    rmSync(gone, { recursive: true })
    expect(list.dirs()).toEqual([kept])
    expect(readFileSync(file, 'utf8')).toBe(`${kept}\n`)
  })

  test('a list with no file is empty, and reading it writes nothing', () => {
    const file = join(root, 'none', 'desks')
    expect(new DeskList(file).dirs()).toEqual([])
    expect(existsSync(file)).toBe(false)
  })

  test('the list of the owner lives under the config folder of the home', () => {
    expect(DeskList.pathFor({ HOME: '/home/a' })).toBe('/home/a/.config/nook/desks')
    expect(DeskList.pathFor({ HOME: '/home/a', XDG_CONFIG_HOME: '/cfg' })).toBe('/cfg/nook/desks')
  })
})
