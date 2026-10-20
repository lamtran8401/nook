import { mock } from 'bun:test'
import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const ENTITY: Record<string, string> = { '&quot;': '"', '&lt;': '<', '&gt;': '>', '&amp;': '&', '&#x27;': "'" }

// a static render has no app router: the client parts that ask for it get one that goes nowhere
mock.module('next/navigation', () => ({
  useRouter: () => ({ push() {}, back() {}, replace() {}, refresh() {} }),
  usePathname: () => '/',
  notFound: () => {
    throw new Error('not found')
  },
  redirect: (to: string) => {
    throw new Error(`redirect to ${to}`)
  },
}))

export const html = (node: ReactElement) => renderToStaticMarkup(node)

/** The words that a reader sees in the markup: no tags, no scripts, entities decoded, one space between words. */
export const text = (markup: string) => markup.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&(quot|lt|gt|amp|#x27);/g, e => ENTITY[e]!).replace(/\s+/g, ' ').trim()
