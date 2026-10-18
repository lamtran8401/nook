'use client'

import { useRouter } from 'next/navigation'
import { type ReactNode, useEffect, useRef } from 'react'

/** A modal Bench dialog over the page before it. Escape, the close button or a click outside goes back to that page. */
export function DialogFrame({ label, children }: { label: string; children: ReactNode }) {
  const router = useRouter()
  const box = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (box.current && !box.current.open) box.current.showModal()
  }, [])
  return (
    <dialog
      ref={box}
      className="bn-dialog nk-dialog"
      aria-label={label}
      onCancel={event => {
        event.preventDefault()
        router.back()
      }}
      onClick={event => {
        if (event.target === box.current) router.back()
      }}
    >
      <button type="button" className="nk-dialog__close" aria-label="Close" onClick={() => router.back()}>×</button>
      {children}
    </dialog>
  )
}
