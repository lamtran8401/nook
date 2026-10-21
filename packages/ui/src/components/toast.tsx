'use client'

import { useSyncExternalStore } from 'react'

type Toast = { id: number; text: string }

const SHOWN_MS = 2800
let shown: Toast[] = []
let nextId = 1
const listeners = new Set<() => void>()
const changed = () => listeners.forEach(listener => listener())

/** The short notes after an action, such as "Copied /close SHOP-41"; each one goes by itself after a few seconds. */
export const toasts = {
  add(text: string): number {
    const id = nextId++
    shown = [...shown, { id, text }]
    changed()
    setTimeout(() => toasts.remove(id), SHOWN_MS)
    return id
  },
  remove(id: number): void {
    shown = shown.filter(t => t.id !== id)
    changed()
  },
  list: (): Toast[] => shown,
  subscribe(listener: () => void): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}

/** The place of the toasts: a pill of thick glass at the bottom of the page. A screen reader hears each one. */
export function Toaster() {
  const list = useSyncExternalStore(toasts.subscribe, toasts.list, () => [])
  return (
    <div aria-live="polite" className="pointer-events-none fixed bottom-[calc(18px+env(safe-area-inset-bottom,0px))] left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2">
      {list.map(t => (
        <p key={t.id} data-slot="toast" className="rounded-full bg-[var(--glass-strong)] px-4 py-2 text-[13px] shadow-lg backdrop-blur-xl">
          {t.text}
        </p>
      ))}
    </div>
  )
}
