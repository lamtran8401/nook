import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { readBoard, readDocs, readItem } from '@nook/engineering/read/reader.ts'

import { buildDemo } from './desk.ts'

let desk: string
beforeAll(() => {
  desk = buildDemo(join(mkdtempSync(join(tmpdir(), 'nook-demo-')), 'desk'))
})
afterAll(() => rmSync(join(desk, '..'), { recursive: true, force: true }))

describe('the demo desk', () => {
  test('holds an item in each state of the flow, a fix and an investigation among them, each with its criteria met so far', () => {
    expect(readBoard(desk).map(c => `${c.id} ${c.state} ${c.criteria.met}/${c.criteria.total}`)).toEqual([
      'SHOP-44 review 1/2',
      'SHOP-42 cooking 1/4',
      'SHOP-43 planning 0/3',
      'SHOP-45 framing 0/0',
      'SHOP-46 backlog 0/0',
      'SHOP-47 cooking 0/2',
      'SHOP-48 cooking 0/0',
      'SHOP-41 done 2/2',
    ])
  })

  test('each item has the story points of its ticket', () => {
    expect(readBoard(desk).map(c => `${c.id} ${c.points}`)).toEqual(['SHOP-44 3', 'SHOP-42 8', 'SHOP-43 5', 'SHOP-45 5', 'SHOP-46 2', 'SHOP-47 2', 'SHOP-48 3', 'SHOP-41 3'])
  })

  test('the item in cooking has a slice in every state, a blocking question and a failing check', () => {
    const view = readItem(desk, 'SHOP-42')
    expect(view.slices.map(s => `${s.id} ${s.state}`)).toEqual(['T1 done', 'T2 done', 'T3 running', 'T4 failed', 'T5 waiting', 'T6 todo'])
    expect(view.next.skill).toStartWith('answer Q2:')
    expect(view.checks.map(c => `${c.area} ${c.result}`)).toEqual(['api pass', 'web fail'])
    expect(view.changes.map(c => `${c.area} ${c.files.length}`)).toEqual(['api 4', 'web 2'])
  })

  test('the fix has its root cause, and the investigation its findings', () => {
    expect(readDocs(desk, 'SHOP-47').find(doc => doc.name === 'root-cause')?.text).toContain('type: missing test')
    expect(readDocs(desk, 'SHOP-48').map(doc => doc.name)).toEqual(['spec', 'plan', 'findings'])
  })

  test('refuses a folder that is not empty', () => {
    const full = mkdtempSync(join(tmpdir(), 'nook-demo-full-'))
    writeFileSync(join(full, 'notes.md'), 'mine\n')
    expect(() => buildDemo(full)).toThrow('is not empty')
    rmSync(full, { recursive: true, force: true })
  })
})
