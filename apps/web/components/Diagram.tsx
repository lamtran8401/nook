'use client'

import { useEffect, useRef } from 'react'

export type DiagramSpec = { type: string; [field: string]: unknown }
type BenchWindow = Window & { BenchDiagrams?: { render(el: Element, spec: DiagramSpec): void } }

/**
 * A diagram drawn by the Bench library after React hydrates. The spec sits in its own attribute, not in
 * data-bn-diagram, so the bundle never redraws a node that React owns before hydration.
 */
export function Diagram({ spec }: { spec: DiagramSpec }) {
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const library = (window as BenchWindow).BenchDiagrams
    if (box.current && library) library.render(box.current, spec)
  }, [spec])
  return <div ref={box} className="nk-diagram" data-nook-diagram={JSON.stringify(spec)} />
}
