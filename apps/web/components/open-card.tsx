'use client'

import { usePathname, useRouter } from 'next/navigation'
import type { ComponentProps, MouseEvent } from 'react'

import { ItemCard } from '@nook/ui/components/item-card.tsx'

// a click with a key held, or with another button, keeps what the browser does with a link: a new tab or a window
const plainClick = (event: MouseEvent) => event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey

/** A card of the board that opens its item in the drawer, through the router, and keeps the highlight while the drawer is open. */
export function OpenCard(props: Omit<ComponentProps<typeof ItemCard>, 'selected' | 'onClick'>) {
  const router = useRouter()
  const path = usePathname()
  const open = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!plainClick(event)) return
    event.preventDefault()
    router.push(props.href, { scroll: false })
  }
  return <ItemCard {...props} selected={path === props.href} onClick={open} />
}
