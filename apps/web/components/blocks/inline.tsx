import type { PhrasingContent } from 'mdast'
import type { ReactNode } from 'react'

import type { Inline as InlineContent } from '@/lib/blocks.ts'

/** The words of a block: marks, code, safe links, and the `{status:…}` and `{date:…}` chips. */

const TOKEN = /\{(status|date):([^}\s]+)\}/g
const STATUS_TONE: Record<string, string> = {
  done: 'success', met: 'success', pass: 'success', passed: 'success', accepted: 'success',
  blocked: 'danger', failed: 'danger', fail: 'danger', error: 'danger',
  review: 'warning', waiting: 'warning', warn: 'warning',
  building: 'primary', cooking: 'primary', running: 'primary', doing: 'primary',
}

// a link with a scheme reaches only the web; javascript: and the like show as words
const isSafeHref = (url: string) => !/^[a-z][a-z0-9+.-]*:/i.test(url) || /^https?:/i.test(url)

function dateChip(value: string, key: number): ReactNode {
  const date = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return `{date:${value}}`
  const shown = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
  return <time className="bn-badge" data-variant="plain" dateTime={value} key={key}>{shown}</time>
}

function withChips(value: string): ReactNode[] {
  const parts: ReactNode[] = []
  let last = 0
  for (const match of value.matchAll(TOKEN)) {
    parts.push(value.slice(last, match.index))
    const [, kind, word] = match
    parts.push(kind === 'date' ? dateChip(word!, match.index) : <span className="bn-badge" data-tone={STATUS_TONE[word!] ?? 'neutral'} key={match.index}>{word}</span>)
    last = match.index + match[0].length
  }
  parts.push(value.slice(last))
  return parts.filter(part => part !== '')
}

function node(item: PhrasingContent, key: number): ReactNode {
  switch (item.type) {
    case 'text':
      return withChips(item.value)
    case 'strong':
      return <strong key={key}><Inline content={item.children} /></strong>
    case 'emphasis':
      return <em key={key}><Inline content={item.children} /></em>
    case 'delete':
      return <del key={key}><Inline content={item.children} /></del>
    case 'inlineCode':
      return <code className="bn-inline-code" key={key}>{item.value}</code>
    case 'break':
      return <br key={key} />
    case 'link':
      return isSafeHref(item.url) ? <a href={item.url} key={key}><Inline content={item.children} /></a> : <Inline content={item.children} key={key} />
    case 'html':
      return item.value
    default:
      return 'value' in item ? String(item.value) : 'children' in item ? <Inline content={item.children as InlineContent} key={key} /> : null
  }
}

export function Inline({ content }: { content: InlineContent }) {
  return <>{content.map(node)}</>
}
