import type { PhrasingContent } from 'mdast'

/** Helpers on the words of a block, kept with their marks. */

export type Inline = PhrasingContent[]
type Cut = { found: RegExpExecArray | null; rest: Inline }

export function plainText(content: Inline): string {
  return content.map(node => ('value' in node ? node.value : 'children' in node ? plainText(node.children as Inline) : '')).join('')
}

const text = (value: string): PhrasingContent => ({ type: 'text', value })
const dropEmpty = (content: Inline) => content.filter(node => node.type !== 'text' || node.value !== '')

/** Cuts `pattern`, anchored with ^, from the text that opens the words. */
export function takePrefix(content: Inline, pattern: RegExp): Cut {
  const first = content[0]
  const found = first?.type === 'text' ? pattern.exec(first.value) : null
  if (!found || first?.type !== 'text') return { found: null, rest: content }
  return { found, rest: dropEmpty([text(first.value.slice(found[0].length)), ...content.slice(1)]) }
}

/** Cuts `pattern`, anchored with $, from the text that ends the words. */
export function takeSuffix(content: Inline, pattern: RegExp): Cut {
  const last = content.at(-1)
  const found = last?.type === 'text' ? pattern.exec(last.value) : null
  if (!found || last?.type !== 'text') return { found: null, rest: content }
  return { found, rest: dropEmpty([...content.slice(0, -1), text(last.value.slice(0, found.index))]) }
}

/** The first sentence and the rest: the split falls at the first full stop that a space follows. */
export function splitSentence(content: Inline): { first: Inline; rest: Inline } {
  for (let i = 0; i < content.length; i++) {
    const node = content[i]!
    const stop = node.type === 'text' ? /\.\s+/.exec(node.value) : null
    if (node.type !== 'text' || !stop) continue
    return {
      first: dropEmpty([...content.slice(0, i), text(node.value.slice(0, stop.index + 1))]),
      rest: dropEmpty([text(node.value.slice(stop.index + stop[0].length)), ...content.slice(i + 1)]),
    }
  }
  return { first: content, rest: [] }
}

/** The words with a capital first letter. */
export function capitalized(content: Inline): Inline {
  const first = content[0]
  if (first?.type !== 'text') return content
  return [text(first.value.charAt(0).toUpperCase() + first.value.slice(1)), ...content.slice(1)]
}
