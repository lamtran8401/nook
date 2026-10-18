import type { ReactNode } from 'react'

/** The board and its modal slot: a card opens its item in a dialog over the board. */
export default function WorksLayout({ children, modal }: { children: ReactNode; modal: ReactNode }) {
  return (
    <>
      {children}
      {modal}
    </>
  )
}
