import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { parse } from 'yaml'

import type { Finding } from '@nook/desk/desks.ts'
import { pluginDir } from '@nook/desk/pack.ts'
import { EvError, Exit } from '@nook/shared/errors.ts'

import { ITEM_KINDS, type ItemKind } from './vocabulary.ts'

/** The flow of each kind: what the guards of the moves ask for, read from `plugins/engineering/flows/<kind>.yml`. */

export type Need = 'required' | 'optional' | 'none'
export type SubmitCheck = 'findings'
export type Flow = {
  kind: ItemKind
  spec: { criteria: 'required' | 'none'; questions: 'required' | 'none' }
  slices: Need
  submit: SubmitCheck[]
}

const RULES = ['kind', 'spec', 'slices', 'submit']
const SPEC_RULES = ['criteria', 'questions']
const ON_OFF = ['required', 'none']
const NEEDS = ['required', 'optional', 'none']
const SUBMIT_CHECKS = ['findings']

type Raw = Record<string, unknown>
const isMap = (value: unknown): value is Raw => typeof value === 'object' && value !== null && !Array.isArray(value)
const oneOf = (list: string[]) => (list.length === 2 ? `${list[0]} or ${list[1]}` : `${list.slice(0, -1).join(', ')} or ${list.at(-1)}`)

/** The problem of one value that must be one of `allowed`, or null. */
function valueProblem(file: string, rule: string, value: unknown, allowed: string[]): string | null {
  return typeof value === 'string' && allowed.includes(value) ? null : `${file}: ${rule} is "${String(value)}"; it takes ${oneOf(allowed)}`
}

/** One flow file: the flow when it holds no problem, and each problem with the file and the rule. */
export function parseFlow(text: string, file: string): { flow: Flow | null; problems: string[] } {
  const raw: unknown = parse(text)
  if (!isMap(raw)) return { flow: null, problems: [`${file}: a flow file is a map of rules`] }
  const kind = file.replace(/\.yml$/, '')
  const spec = isMap(raw.spec) ? raw.spec : {}
  const submit = Array.isArray(raw.submit) ? raw.submit : []
  const problems = [
    ...(raw.kind === kind ? [] : [`${file}: kind is "${String(raw.kind)}"; the file of the kind ${kind} must name ${kind}`]),
    ...Object.keys(raw)
      .filter(key => !RULES.includes(key))
      .map(key => `${file}: ${key} is no rule of a flow; the rules are ${RULES.join(', ')}`),
    ...Object.keys(spec)
      .filter(key => !SPEC_RULES.includes(key))
      .map(key => `${file}: spec.${key} is no rule of a flow; the rules of spec are ${SPEC_RULES.join(', ')}`),
    ...SPEC_RULES.map(rule => valueProblem(file, `spec.${rule}`, spec[rule], ON_OFF)).filter(problem => problem !== null),
    ...[valueProblem(file, 'slices', raw.slices, NEEDS)].filter(problem => problem !== null),
    ...(Array.isArray(raw.submit) ? [] : [`${file}: submit is a list, such as [] or [findings]`]),
    ...submit.filter(check => !SUBMIT_CHECKS.includes(String(check))).map(check => `${file}: submit names "${String(check)}"; it takes ${SUBMIT_CHECKS.join(', ')}`),
  ]
  if (problems.length) return { flow: null, problems }
  return { flow: { kind: kind as ItemKind, spec: spec as Flow['spec'], slices: raw.slices as Need, submit: submit as SubmitCheck[] }, problems }
}

/** The flow of each kind in a folder, and each problem: a broken file, or a kind with no file. */
export function readFlows(dir: string): { flows: Map<ItemKind, Flow>; problems: string[] } {
  const flows = new Map<ItemKind, Flow>()
  const problems: string[] = []
  for (const kind of ITEM_KINDS) {
    const file = `${kind}.yml`
    if (!existsSync(join(dir, file))) {
      problems.push(`${file} is missing: each kind needs a flow file`)
      continue
    }
    const read = parseFlow(readFileSync(join(dir, file), 'utf8'), file)
    problems.push(...read.problems)
    if (read.flow) flows.set(kind, read.flow)
  }
  return { flows, problems }
}

const packFlowsDir = () => join(pluginDir('engineering'), 'flows')
let packFlows: Map<ItemKind, Flow> | undefined

/** The flow of a kind in the pack. A flow file with a problem stops the caller, so a guard never runs on a broken flow. */
export function flowOf(kind: ItemKind): Flow {
  if (!packFlows) {
    const read = readFlows(packFlowsDir())
    if (read.problems.length) throw new EvError(`the flow files of engineering have problems: ${read.problems.join('; ')}`, Exit.error, 'nook doctor names each one')
    packFlows = read.flows
  }
  return packFlows.get(kind)!
}

/** The problems of the flow files as doctor findings. */
export function flowFindings(dir = packFlowsDir()): Finding[] {
  return readFlows(dir).problems.map(text => ({ level: 'error' as const, where: 'engineering flows', text, fix: `fix the flow files in ${dir}` }))
}
