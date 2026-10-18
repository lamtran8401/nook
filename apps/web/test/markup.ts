import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const ENTITY: Record<string, string> = { '&quot;': '"', '&lt;': '<', '&gt;': '>', '&amp;': '&', '&#x27;': "'" }

export const html = (node: ReactElement) => renderToStaticMarkup(node)

/** The words that a reader sees in the markup: no tags, no scripts, entities decoded, one space between words. */
export const text = (markup: string) => markup.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&(quot|lt|gt|amp|#x27);/g, e => ENTITY[e]!).replace(/\s+/g, ' ').trim()
