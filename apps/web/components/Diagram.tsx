'use client'

import { useRouter } from 'next/navigation'
import { type MouseEvent, useEffect, useRef } from 'react'

export type DiagramSpec = { type: string; [field: string]: unknown }
type BenchWindow = Window & { BenchDiagrams?: { render(el: Element, spec: DiagramSpec): void } }

/** A plain click on a link of the web app; a click with a key or another button keeps the default, such as a new tab. */
const appLink = (event: MouseEvent): HTMLAnchorElement | null => {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null
  return (event.target as Element).closest<HTMLAnchorElement>('a[href^="/"]')
}

/**
 * A diagram drawn by the Bench library after React hydrates. The spec sits in its own attribute, not in
 * data-bn-diagram, so the bundle never redraws a node that React owns before hydration. A link that the library
 * draws, such as a card of a board, goes through the router, so the item opens in its dialog over the board.
 */
export function Diagram({ spec }: { spec: DiagramSpec }) {
  const box = useRef<HTMLDivElement>(null)
  const router = useRouter()
  useEffect(() => {
    const library = (window as BenchWindow).BenchDiagrams
    if (box.current && library) library.render(box.current, spec)
  }, [spec])
  const follow = (event: MouseEvent) => {
    const link = appLink(event)
    if (!link) return
    event.preventDefault()
    router.push(link.getAttribute('href')!, { scroll: false })
  }
  return <div ref={box} className="nk-diagram" data-nook-diagram={JSON.stringify(spec)} onClick={follow} />
}
