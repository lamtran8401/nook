import { match } from 'ts-pattern'

/**
 * A ```tree block of a document: the changed files as a tree. A line that ends in `/` is a folder; the lines
 * under it, two more spaces in, are its rows. A file line is `name  mark  note`, with two spaces or more between.
 */

export type Mark = 'new' | 'changed' | 'deleted' | 'moved'
export type TreeFolder = { name: string; note: string; children: TreeNode[] }
export type TreeFile = { name: string; mark: Mark | null; note: string }
export type TreeNode = TreeFolder | TreeFile

const MARKS: Mark[] = ['new', 'changed', 'deleted', 'moved']

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function parseFileTree(source: string): TreeNode[] {
  const root: TreeNode[] = []
  const open: { depth: number; children: TreeNode[] }[] = [{ depth: -1, children: root }]
  for (const line of source.split('\n')) {
    if (!line.trim()) continue
    const depth = line.length - line.trimStart().length
    while (open.at(-1)!.depth >= depth) open.pop()
    const [head = '', ...rest] = line.trim().split(/\s{2,}/)
    const parent = open.at(-1)!.children
    if (head.endsWith('/')) {
      const folder: TreeFolder = { name: head.slice(0, -1), note: rest.join(' '), children: [] }
      parent.push(folder)
      open.push({ depth, children: folder.children })
      continue
    }
    const mark = MARKS.find(m => m === rest[0]) ?? null
    parent.push({ name: head, mark, note: (mark ? rest.slice(1) : rest).join(' ') })
  }
  return root
}

const toneOf = (mark: Mark) =>
  match(mark)
    .with('new', () => 'success')
    .with('changed', () => 'warning')
    .with('deleted', () => 'danger')
    .with('moved', () => 'neutral')
    .exhaustive()

function row(icon: 'file' | 'folder', name: string, mark: Mark | null, note: string): string {
  const badge = mark ? `<span class="bn-badge" data-tone="${toneOf(mark)}" data-size="sm">${mark}</span>` : ''
  const text = note ? `<span class="kd-tree__note">${esc(note)}</span>` : ''
  return `<span class="bn-tree__row"><span data-bn-icon="${icon}"></span><span class="kd-tree__name">${esc(name)}</span>${badge}${text}</span>`
}

function nodeHtml(node: TreeNode): string {
  if ('children' in node)
    return `<li><details open><summary>${row('folder', node.name, null, node.note)}</summary><ul>${node.children.map(nodeHtml).join('')}</ul></details></li>`
  return `<li>${row('file', node.name, node.mark, node.note)}</li>`
}

/** The tree with the Tree component of the UI kit, each mark as a badge of its tone. */
export function fileTreeHtml(nodes: TreeNode[]): string {
  return `<div class="bn-tree kd-tree"><ul>${nodes.map(nodeHtml).join('')}</ul></div>`
}
