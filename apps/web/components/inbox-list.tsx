'use client'

import { type ReactNode, useEffect, useRef, useState } from 'react'

import { InboxRow } from '@nook/ui/components/inbox-row.tsx'

export type InboxListRow = { key: string; tone: string; id?: string; title: ReactNode; sub?: ReactNode; actions?: ReactNode; below?: ReactNode }

// a key typed into a field is words, not a move on the list
const typing = (target: EventTarget | null) => target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))

/**
 * The moves that wait for the owner, as rows: J and K pick a row, A runs the gate of the picked row after its confirm,
 * and R puts the cursor in its answer box. A click picks a row too; at rest no row is picked.
 */
export function InboxList({ rows }: { rows: InboxListRow[] }) {
  const [picked, setPicked] = useState(-1)
  const list = useRef<HTMLOListElement>(null)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || typing(event.target)) return
      const row = list.current?.children[picked]
      if (event.key === 'j') setPicked(at => Math.min(at + 1, rows.length - 1))
      else if (event.key === 'k') setPicked(at => Math.max(at - 1, 0))
      else if (event.key === 'a') row?.querySelector<HTMLButtonElement>('[data-key="a"]')?.click()
      else if (event.key === 'r' && row?.querySelector('input[name="answer"]')) {
        event.preventDefault()
        row.querySelector<HTMLInputElement>('input[name="answer"]')!.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [picked, rows.length])

  return (
    <ol ref={list} className="grid gap-0.5">
      {rows.map((row, i) => (
        <InboxRow key={row.key} tone={row.tone} id={row.id} title={row.title} sub={row.sub} actions={row.actions} below={row.below} selected={i === picked} onClick={() => setPicked(i)} />
      ))}
    </ol>
  )
}
