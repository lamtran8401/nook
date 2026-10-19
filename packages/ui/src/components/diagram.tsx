'use client'

import { type MouseEvent, useEffect, useRef } from 'react'

import { cn } from '@nook/ui/lib/utils.ts'

export type DiagramSpec = { type: string; [field: string]: unknown }
type BenchWindow = Window & { BenchDiagrams?: { render(el: Element, spec: DiagramSpec): void } }

/** A plain click on a link of the same site; a click with a key or another button keeps the default, such as a new tab. */
function siteLink(event: MouseEvent): string | null {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null
  return (event.target as Element).closest('a[href^="/"]')?.getAttribute('href') ?? null
}

/**
 * A diagram that the Bench library draws after the page loads; its spec waits in an attribute of its own, so the
 * library never redraws a node that React owns before hydration. `onLink` takes a click on a link that the diagram draws.
 */
export function Diagram({ spec, onLink, className }: { spec: DiagramSpec; onLink?: (href: string) => void; className?: string }) {
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const library = (window as BenchWindow).BenchDiagrams
    if (box.current && library) library.render(box.current, spec)
  }, [spec])
  const follow = (event: MouseEvent) => {
    const href = onLink ? siteLink(event) : null
    if (!href) return
    event.preventDefault()
    onLink!(href)
  }
  return <div ref={box} data-slot="diagram" data-diagram={JSON.stringify(spec)} className={cn('min-w-0', className)} onClick={follow} />
}
