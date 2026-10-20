import { afterEach, describe, expect, test } from 'bun:test'
import { readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'

import { RootCauseWritten } from '../src/guards/root-cause.ts'
import { GuardContext } from '../src/guards/guard.ts'
import { itemAt, LEAD, makeHome, SPEC, type TestHome, writeDoc } from './helpers.ts'

let t: TestHome
afterEach(() => t.cleanup())

const LIST = '  rootCauses: [Requirement problem, Integration error, Unknown]\n  unknownRootCause: Unknown\n'
const cause = (front: string, analysis = 'The page sends userId; the api reads user_id.') => `---\n${front}\n---\n\n# SHOP-1: the root cause\n\n${analysis}\n`
const file = () => join(t.home.workDir('SHOP-1'), 'root-cause.md')

/** A fix in cooking whose one slice is done and verified, so only the root cause can stop its submit. */
function fixBuilt(extra?: string) {
  t = makeHome(extra ? { extra } : {})
  itemAt(t, 'cooking', 'SHOP-1', SPEC({ kind: 'fix' }))
  const lead = t.eng(LEAD)
  lead.moveSlice('start', 'SHOP-1', 'T1')
  lead.moveSlice('done', 'SHOP-1', 'T1', { files: ['a.ts'] })
  lead.verify('SHOP-1')
}
const gaps = () => {
  const eng = t.eng(LEAD)
  return new RootCauseWritten().check(new GuardContext(t.home, eng.stores, eng.item('SHOP-1')))
}

describe('the root cause of a fix', () => {
  test('begin writes root-cause.md from its template, and an unfilled one names the type and the analysis', () => {
    fixBuilt()
    expect(readFileSync(file(), 'utf8')).toStartWith('---\ntype: \n---\n\n# SHOP-1: the root cause\n')
    expect(gaps().map(g => g.text)).toEqual(['root-cause.md: the type is missing', 'root-cause.md: the analysis is missing'])
  })

  test('with no root-cause.md, submit refuses and names the file and its shape', () => {
    fixBuilt()
    rmSync(file())
    expect(gaps()).toEqual([{ text: 'root-cause.md is missing', fix: `write ${file()}: front matter type, then the analysis in a few lines under it` }])
  })

  test('with a list in nook.yml, a type that is not on it is refused with the list', () => {
    fixBuilt(LIST)
    writeDoc(t, 'SHOP-1', 'root-cause.md', cause('type: Logically incorrect'))
    expect(gaps()).toEqual([{ text: 'root-cause.md: the type "Logically incorrect" is not in engineering.rootCauses: Requirement problem, Integration error, Unknown', fix: `pick one type for ${file()}` }])
  })

  test('the type that means not known yet passes only with a reason', () => {
    fixBuilt(LIST)
    writeDoc(t, 'SHOP-1', 'root-cause.md', cause('type: Unknown'))
    expect(gaps()).toEqual([{ text: 'root-cause.md: the type Unknown needs a reason in the front matter', fix: `write reason: <why the cause is not known yet> in ${file()}` }])
    writeDoc(t, 'SHOP-1', 'root-cause.md', cause('type: Unknown\nreason: the error comes only with production data'))
    expect(gaps()).toEqual([])
  })

  test('with no list, any type passes; submit moves the fix to review and keeps the type in the ledger', () => {
    fixBuilt()
    writeDoc(t, 'SHOP-1', 'root-cause.md', cause('type: Integration error'))
    expect(gaps()).toEqual([])
    const lead = t.eng(LEAD)
    expect(lead.moveItem('submit', 'SHOP-1').item.state).toBe('review')
    expect(lead.item('SHOP-1').root_cause).toBe('Integration error')
  })

  test('a feature has no root cause to write', () => {
    t = makeHome()
    itemAt(t, 'cooking')
    expect(gaps()).toEqual([])
  })
})
