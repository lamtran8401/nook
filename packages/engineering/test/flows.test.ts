import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { type Flow, flowFindings, flowOf, parseFlow, readFlows } from '../src/flows.ts'

let dir: string
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'nook-flows-'))
})
afterEach(() => rmSync(dir, { recursive: true, force: true }))

const write = (kind: string, text: string) => writeFileSync(join(dir, `${kind}.yml`), text)
const CODE: Omit<Flow, 'kind'> = { spec: { criteria: 'required', questions: 'none', sections: [] }, areas: 'required', slices: 'required', submit: [] }

describe('the flows of the pack', () => {
  test('each kind has its flow: a feature, a fix and a chore build slices to criteria in areas; an investigation answers questions, with slices and areas or none', () => {
    expect(flowOf('feature')).toEqual({ kind: 'feature', ...CODE })
    expect(flowOf('fix')).toEqual({ kind: 'fix', spec: { criteria: 'required', questions: 'none', sections: ['Reproduce', 'Actual', 'Expected'] }, areas: 'required', slices: 'required', submit: ['root-cause'] })
    expect(flowOf('chore')).toEqual({ kind: 'chore', ...CODE })
    expect(flowOf('investigate')).toEqual({ kind: 'investigate', spec: { criteria: 'none', questions: 'required', sections: [] }, areas: 'optional', slices: 'optional', submit: ['findings'] })
  })
})

describe('parseFlow', () => {
  test('names each rule that the code does not know, and each value that a rule does not take', () => {
    const { problems } = parseFlow('kind: fix\ncolour: red\nspec: { criteria: maybe, questions: none }\nareas: required\nslices: lots\nsubmit: [poem]\n', 'fix.yml')
    expect(problems).toEqual([
      'fix.yml: colour is no rule of a flow; the rules are kind, spec, slices, areas, submit',
      'fix.yml: spec.criteria is "maybe"; it takes required or none',
      'fix.yml: slices is "lots"; it takes required, optional or none',
      'fix.yml: submit names "poem"; it takes findings, root-cause',
    ])
  })

  test('a file must name the kind of its file name', () => {
    expect(parseFlow('kind: chore\nspec: { criteria: required, questions: none }\nareas: required\nslices: required\nsubmit: []\n', 'fix.yml').problems).toEqual(['fix.yml: kind is "chore"; the file of the kind fix must name fix'])
  })
})

describe('readFlows and flowFindings', () => {
  test('a folder with no file for a kind is a problem; the doctor shows each problem as an error with its fix', () => {
    for (const kind of ['feature', 'fix', 'investigate']) write(kind, `kind: ${kind}\nspec: { criteria: required, questions: none }\nareas: required\nslices: required\nsubmit: []\n`)
    expect(readFlows(dir).problems).toEqual(['chore.yml is missing: each kind needs a flow file'])
    expect(flowFindings(dir)).toEqual([{ level: 'error', where: 'engineering flows', text: 'chore.yml is missing: each kind needs a flow file', fix: `fix the flow files in ${dir}` }])
  })
})
