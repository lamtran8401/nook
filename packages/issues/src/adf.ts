/** The Atlassian Document Format of Jira, as Markdown: the rich text of a description, a field or a comment. */

type Node = { type?: string; text?: string; attrs?: Record<string, unknown>; marks?: { type: string; attrs?: Record<string, unknown> }[]; content?: Node[] }

const attr = (node: Node, name: string) => (typeof node.attrs?.[name] === 'string' ? (node.attrs[name] as string) : '')

function marked(node: Node): string {
  let text = node.text ?? ''
  for (const mark of node.marks ?? []) {
    if (mark.type === 'strong') text = `**${text}**`
    else if (mark.type === 'em') text = `*${text}*`
    else if (mark.type === 'code') text = `\`${text}\``
    else if (mark.type === 'strike') text = `~~${text}~~`
    else if (mark.type === 'link' && typeof mark.attrs?.href === 'string') text = `[${text}](${mark.attrs.href})`
  }
  return text
}

/** The words of an inline node. */
function inline(node: Node): string {
  switch (node.type) {
    case 'text':
      return marked(node)
    case 'hardBreak':
      return '\n'
    case 'mention':
      return attr(node, 'text')
    case 'emoji':
      return attr(node, 'shortName') || attr(node, 'text')
    case 'inlineCard':
      return attr(node, 'url')
    case 'status':
      return attr(node, 'text')
    default:
      return (node.content ?? []).map(inline).join('')
  }
}

const indent = (text: string, by: string) => text.split('\n').map((line, i) => (i ? `${by}${line}` : line)).join('\n')
const cellText = (cell: Node) => (cell.content ?? []).map(block).join(' ').replace(/\n+/g, ' ').trim()

function table(node: Node): string {
  const rows = (node.content ?? []).map(row => (row.content ?? []).map(cellText))
  if (!rows.length) return ''
  const line = (cells: string[]) => `| ${cells.join(' | ')} |`
  return [line(rows[0]!), `|${rows[0]!.map(() => '---').join('|')}|`, ...rows.slice(1).map(line)].join('\n')
}

/** The Markdown of a block node; blocks join with a blank line. */
function block(node: Node): string {
  const inner = () => (node.content ?? []).map(block).filter(Boolean).join('\n\n')
  switch (node.type) {
    case 'paragraph':
      return (node.content ?? []).map(inline).join('')
    case 'heading':
      return `${'#'.repeat(Math.min(Number(node.attrs?.level) || 1, 6))} ${(node.content ?? []).map(inline).join('')}`
    case 'bulletList':
      return (node.content ?? []).map(item => `- ${indent(block(item), '  ')}`).join('\n')
    case 'orderedList':
      return (node.content ?? []).map((item, i) => `${i + 1}. ${indent(block(item), '   ')}`).join('\n')
    case 'listItem':
      return (node.content ?? []).map(block).join('\n')
    case 'codeBlock':
      return `\`\`\`${attr(node, 'language')}\n${(node.content ?? []).map(inline).join('')}\n\`\`\``
    case 'blockquote':
      return inner().split('\n').map(line => `> ${line}`).join('\n')
    case 'panel': {
      const kind = attr(node, 'panelType') || 'note'
      return `> **${kind.charAt(0).toUpperCase()}${kind.slice(1)}:** ${inner().split('\n').join('\n> ')}`
    }
    case 'rule':
      return '---'
    case 'table':
      return table(node)
    case 'mediaSingle':
    case 'mediaGroup':
      return (node.content ?? []).map(media => `[image: ${attr(media, 'alt') || attr(media, 'id') || 'file'}]`).join('\n')
    default:
      return node.content?.length ? inner() : inline(node)
  }
}

export const isAdf = (value: unknown): value is Node => typeof value === 'object' && value !== null && (value as Node).type === 'doc'

export function adfToMarkdown(doc: Node): string {
  return (doc.content ?? []).map(block).filter(Boolean).join('\n\n').trim()
}
