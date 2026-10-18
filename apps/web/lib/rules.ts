import type { Block, Source } from './blocks.ts'
import { capitalized, type Inline, plainText, splitSentence, takePrefix, takeSuffix } from './inline.ts'

/** The tag before a criterion, such as `[ADD]`, in a spec and in the ledger. */
export const CRITERION_TAG = /^\[(ADD|CHANGE|REMOVE|NONE)\]\s*/

/**
 * The heading rules: the first list under a known heading of a document becomes the block of that heading, as the item
 * page shows it. A quote that opens with In short or Need to know is a callout, and `None: a, b.` names the kinds with
 * no impact.
 */

type ListBlock = Extract<Block, { kind: 'list' | 'tasks' }>

const REFS = /\s*\(([^)]*)\)\s*$/
const LEVELS: readonly string[] = ['low', 'med', 'high']
const TASK_ROWS: [string, string][] = [['acs', 'Criteria'], ['files', 'Files'], ['done when', 'Done when'], ['proof', 'Proof']]

/** The words of each item of a list: the words of its first paragraph. */
const itemWords = (list: ListBlock): Inline[] =>
  (list.kind === 'list' ? list.items : list.items.map(i => i.blocks)).map(blocks => {
    const first = blocks.find(b => b.kind === 'paragraph')
    return first?.kind === 'paragraph' ? first.content : []
  })

function sourcesOf(refs: string): Source[] {
  const sources: Source[] = []
  for (const word of refs.split(/,\s*/).filter(Boolean)) {
    const last = sources.at(-1)
    if (LEVELS.includes(word) && last) last.level = word as Source['level']
    else sources.push({ text: word })
  }
  return sources
}

/** `**Label:** words`: the label in bold, and the words after it; slice ids such as `(T1, T4)` after the label go. */
function labeled(content: Inline): { label: string; words: Inline } {
  const first = content[0]
  if (first?.type !== 'strong') return { label: '', words: content }
  const { rest } = takePrefix(content.slice(1), /^\s*(\([^)]*\))?\s*:?\s*/)
  return { label: plainText(first.children).replace(/:$/, '').trim(), words: rest }
}

function withRefs(content: Inline): { words: Inline; refs: string } {
  const { found, rest } = takeSuffix(content, REFS)
  return { words: rest, refs: found?.[1] ?? '' }
}

const RULES: Record<string, (list: ListBlock) => Block> = {
  'Acceptance criteria': list => ({
    kind: 'criteria',
    items: itemWords(list).map((content, i) => {
      const tagged = takePrefix(content, CRITERION_TAG)
      const { words, refs } = withRefs(tagged.rest)
      return { n: i + 1, tag: tagged.found?.[1] ?? '', content: words, refs: refs ? refs.split(/,\s*/) : [] }
    }),
  }),
  Details: list => ({
    kind: 'rules',
    items: itemWords(list).map(content => {
      const { label, words } = labeled(content)
      const { words: rule, refs } = withRefs(words)
      return { label, content: rule, sources: sourcesOf(refs) }
    }),
  }),
  'What works now': list => ({
    kind: 'pieces',
    items: itemWords(list).map(content => {
      const { label, words } = labeled(content)
      return { title: label, content: words }
    }),
  }),
  'Try it': list => ({
    kind: 'steps',
    items: itemWords(list).map(content => {
      const { first, rest } = splitSentence(content)
      return { action: first, seen: rest }
    }),
  }),
  'Out of scope': list => ({ kind: 'outlist', items: itemWords(list) }),
  'Where to start reading': list => ({ kind: 'numbered', items: itemWords(list) }),
  'Heads up': list => ({ kind: 'headsup', items: itemWords(list) }),
  'Requirements met': list => ({ kind: 'met', items: itemWords(list) }),
}

function callout(block: Extract<Block, { kind: 'quote' }>): Block {
  const first = block.blocks[0]
  if (block.blocks.length !== 1 || first?.kind !== 'paragraph') return block
  const { found, rest } = takePrefix(first.content, /^(In short|Need to know):\s*/)
  if (!found) return block
  return { kind: 'callout', tone: found[1] === 'In short' ? 'short' : 'know', content: capitalized(rest) }
}

function noImpact(block: Extract<Block, { kind: 'paragraph' }>): Block {
  const words = block.content.length === 1 ? /^None: (.+)\.$/.exec(plainText(block.content)) : null
  return words ? { kind: 'none', kinds: words[1]!.split(/,\s*/) } : block
}

/** `## T1: title` with `- key: value` lines under it: one task card. */
function taskCard(heading: string, list: ListBlock): Block | null {
  const [, id, title] = /^(T\d+):\s*(.*)$/.exec(heading) ?? []
  if (!id) return null
  const fields = new Map<string, Inline>()
  for (const content of itemWords(list)) {
    const { found, rest } = takePrefix(content, /^([a-z][a-z ]*):\s*/)
    if (!found) return null
    fields.set(found[1]!, rest)
  }
  const field = (key: string) => plainText(fields.get(key) ?? [])
  const rows = TASK_ROWS.filter(([key]) => fields.has(key)).map(([key, label]): [string, Inline] => [label, fields.get(key)!])
  return { kind: 'task', id, title: title!, area: field('area'), depends: field('depends') || 'none', size: field('size'), rows }
}

export function applyRules(blocks: Block[]): Block[] {
  const out: Block[] = []
  let section = ''
  let used = false
  for (const block of blocks) {
    if (block.kind === 'heading' && block.depth === 2) {
      section = plainText(block.content)
      used = false
      out.push(block)
      continue
    }
    const rule = RULES[section]
    if ((block.kind === 'list' || block.kind === 'tasks') && !used) {
      used = true
      const task = taskCard(section, block)
      if (task) {
        out.splice(out.length - 1, 1, task)
        continue
      }
      if (rule) {
        out.push(rule(block))
        continue
      }
    }
    out.push(block.kind === 'quote' ? callout(block) : block.kind === 'paragraph' ? noImpact(block) : block)
  }
  return out
}
