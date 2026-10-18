import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { Catalog } from './catalog.ts'

/**
 * The check of a Bench diagram spec, as an agent writes it in a `bench` block. The fields come from the tables of
 * DIAGRAMS.md, so the doc is the schema; the check adds the references that a table cannot say.
 */

export type TypeSchema = { top: Set<string>; required: string[]; items: Record<string, Set<string>> }
export type BenchSchema = Record<string, TypeSchema>

// the sub-tables whose fields belong to an item, not to the spec
const ITEM_SECTIONS: Record<string, Record<string, string>> = { graph: { Node: 'nodes', Edge: 'edges', Group: 'groups' } }
const ITEM_HEADERS: Record<string, string> = { 'Entry field': 'items', 'Card field': 'cards' }
const COMMON = ['type', 'frame']
const SEPARATOR = /^\|[\s:|-]+\|$/

const cells = (line: string) => line.split('|').slice(1, -1).map(cell => cell.trim())
const names = (cell: string) => [...cell.matchAll(/`([A-Za-z]\w*)`/g)].map(m => m[1]!)

let cached: BenchSchema | null = null

export function benchSchema(): BenchSchema {
  if (cached) return cached
  const lines = readFileSync(join(Catalog.load().dirOf('core'), 'ui', 'bench', 'DIAGRAMS.md'), 'utf8').split('\n')
  const schema: BenchSchema = {}
  let section = ''
  let sub = ''
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    if (line.startsWith('## ')) [section, sub] = [line.slice(3).trim(), '']
    else if (line.startsWith('### ')) sub = line.slice(4).trim()
    if (!line.startsWith('|') || !SEPARATOR.test(lines[i + 1] ?? '')) continue
    const header = cells(line)[0] ?? ''
    const rows: string[][] = []
    for (i += 2; i < lines.length && lines[i]!.startsWith('|'); i++) rows.push(cells(lines[i]!))
    i--
    const fields = rows.flatMap(row => names(row[0] ?? ''))
    if (header === 'Field' && !sub && fields.includes('type')) schema[section] = { top: new Set(COMMON), required: [], items: {} }
    const type = schema[section]
    if (!type) continue
    const item = header === 'Field' ? ITEM_SECTIONS[section]?.[sub] : ITEM_HEADERS[header]
    const target = item ? (type.items[item] ??= new Set()) : header === 'Field' ? type.top : null
    for (const field of fields) target?.add(field)
    if (header === 'Field' && !sub && !item) type.required.push(...rows.filter(row => row[1] === 'required').flatMap(row => names(row[0] ?? '')))
  }
  cached = schema
  return schema
}

type Spec = Record<string, unknown>
const isObject = (value: unknown): value is Spec => typeof value === 'object' && value !== null && !Array.isArray(value)
const list = (value: unknown): Spec[] => (Array.isArray(value) ? value.filter(isObject) : [])
const andList = (words: string[]) => (words.length > 1 ? `${words.slice(0, -1).join(', ')} and ${words.at(-1)}` : (words[0] ?? ''))
const unknownIn = (item: Spec, allowed: Set<string> | undefined) => (allowed ? Object.keys(item).filter(key => !allowed.has(key)) : [])

/** Each problem of a spec, in words that an agent can act on; none for a valid spec. */
export function checkSpec(spec: unknown, schema: BenchSchema = benchSchema()): string[] {
  if (!isObject(spec)) return ['the block is not a JSON object']
  if (!('type' in spec)) return ['the block has no "type"']
  const type = String(spec.type)
  const rules = schema[type]
  if (!rules) return [`no diagram type is named "${type}"; the types are ${andList(Object.keys(schema))}`]
  const missing = rules.required.filter(field => !(field in spec)).map(field => `${type} needs "${field}"`)
  if (missing.length) return missing
  const unknown = Object.keys(spec).filter(key => !rules.top.has(key)).map(key => `${type} has no field "${key}"`)
  const details = type === 'graph' ? graphProblems(spec, rules) : type === 'sequence' ? sequenceProblems(spec) : type === 'tree' ? treeProblems(list(spec.items), rules) : type === 'board' ? boardProblems(spec, rules) : []
  return [...unknown, ...details]
}

function graphProblems(spec: Spec, rules: TypeSchema): string[] {
  const nodes = list(spec.nodes)
  const ids = nodes.map(node => String(node.id))
  const known = new Set(ids)
  const problems: string[] = []
  for (const id of new Set(ids.filter((id, i) => ids.indexOf(id) !== i))) problems.push(`two nodes have the id "${id}"`)
  for (const node of nodes) for (const key of unknownIn(node, rules.items.nodes)) problems.push(`node "${String(node.id)}" has a field that a node of a graph does not have: "${key}"`)
  const placed = nodes.filter(node => 'at' in node).length
  if (placed && placed < nodes.length) problems.push('give every node a place with "at", or none')
  list(spec.edges).forEach((edge, i) => {
    for (const key of unknownIn(edge, rules.items.edges)) problems.push(`edge ${i + 1} has a field that an edge of a graph does not have: "${key}"`)
    // an edge can end at a row of a table node: node.row
    const from = String(edge.from).split('.')[0]!
    const to = String(edge.to).split('.')[0]!
    if (!known.has(from)) problems.push(`edge ${i + 1} comes from "${from}", a node that the block does not have`)
    if (!known.has(to)) problems.push(`edge ${i + 1} goes to "${to}", a node that the block does not have`)
  })
  for (const group of list(spec.groups)) {
    for (const key of unknownIn(group, rules.items.groups)) problems.push(`group "${String(group.label)}" has a field that a group of a graph does not have: "${key}"`)
    for (const id of Array.isArray(group.nodes) ? group.nodes.map(String) : []) if (!known.has(id)) problems.push(`group "${String(group.label)}" lists "${id}", a node that the block does not have`)
  }
  return problems
}

function sequenceProblems(spec: Spec): string[] {
  const parts = new Set(list(spec.parts).map(part => String(part.id)))
  const problems: string[] = []
  list(spec.steps).forEach((step, i) => {
    for (const side of ['from', 'to'] as const)
      if (side in step && !parts.has(String(step[side]))) problems.push(`step ${i + 1} ${side === 'from' ? 'comes from' : 'goes to'} "${String(step[side])}", a part that the block does not have`)
    for (const id of Array.isArray(step.over) ? step.over.map(String) : []) if (!parts.has(id)) problems.push(`step ${i + 1} is over "${id}", a part that the block does not have`)
  })
  return problems
}

function treeProblems(entries: Spec[], rules: TypeSchema): string[] {
  return entries.flatMap(entry => [
    ...unknownIn(entry, rules.items.items).map(key => `entry "${String(entry.name)}" has a field that a tree entry does not have: "${key}"`),
    ...treeProblems(list(entry.children), rules),
  ])
}

function boardProblems(spec: Spec, rules: TypeSchema): string[] {
  return list(spec.columns).flatMap(column =>
    list(column.cards).flatMap(card => unknownIn(card, rules.items.cards).map(key => `card "${String(card.id ?? card.title)}" has a field that a board card does not have: "${key}"`)),
  )
}
