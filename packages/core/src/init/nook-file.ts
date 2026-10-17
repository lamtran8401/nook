import { isMap, isScalar, isSeq, parseDocument, type YAMLSeq } from 'yaml'

import { usage } from '@nook/shared/errors.ts'

export function nookYaml(packs: string[]): string {
  return [
    '# Nook: this folder is an environment. The folders inside it get its packs and its rules.',
    '# packs: the packs on here, in addition to the ones of the environments above. packs.off turns one off.',
    '# rules.off: base rules that you do not want written. Each pack reads its own section by its name.',
    `packs: [${packs.join(', ')}]`,
    '',
  ].join('\n')
}

/** Adds packs to the pack list of nook.yml. Only the list changes: every other byte of the file stays. */
export function addPacks(source: string, missing: string[]): string {
  const doc = parseDocument(source)
  const packs = doc.get('packs', true)
  if (packs === undefined) return `${source.trimEnd()}\npacks: [${missing.join(', ')}]\n`
  const list = isMap(packs) ? packs.get('on', true) : packs
  if (!isSeq(list) || !list.range) throw usage('nook.yml has no list of packs that Nook can add to', `add the packs by hand: ${missing.join(', ')}`)
  const have = list.items.map(item => (isScalar(item) ? String(item.value) : String(item)))
  const added = missing.filter(name => !have.includes(name))
  if (!added.length) return source
  return list.flow ? spliceFlow(source, list, [...have, ...added]) : appendBlock(source, list, added)
}

function spliceFlow(source: string, list: YAMLSeq, names: string[]): string {
  const [start, end] = list.range!
  return `${source.slice(0, start)}[${names.join(', ')}]${source.slice(end)}`
}

/** A block list (`- a` lines) gets one line for each new pack, with the indent of the first item. */
function appendBlock(source: string, list: YAMLSeq, added: string[]): string {
  const first = list.items[0] as { range?: [number, number, number] } | undefined
  const last = list.items.at(-1) as { range?: [number, number, number] } | undefined
  if (!first?.range || !last?.range) throw usage('nook.yml has an empty block list of packs', `write packs: [${added.join(', ')}]`)
  const lineStart = source.lastIndexOf('\n', first.range[0] - 1) + 1
  const prefix = source.slice(lineStart, first.range[0])
  // after the end of the line of the last item, so a comment stays on its own line
  const lineEnd = source.indexOf('\n', last.range[1])
  const at = lineEnd < 0 ? source.length : lineEnd
  return source.slice(0, at) + added.map(name => `\n${prefix}${name}`).join('') + source.slice(at)
}
