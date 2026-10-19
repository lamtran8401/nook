'use client'

import { useRouter } from 'next/navigation'

import { Diagram as KitDiagram, type DiagramSpec } from '@nook/ui/components/diagram.tsx'

export type { DiagramSpec }

/** The diagram of the kit, with a link that it draws, such as a card of a board, sent through the router. */
export function Diagram({ spec }: { spec: DiagramSpec }) {
  const router = useRouter()
  return <KitDiagram spec={spec} onLink={href => router.push(href, { scroll: false })} />
}
