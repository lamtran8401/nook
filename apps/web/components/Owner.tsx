'use client'

import { createContext, type ReactNode, useContext } from 'react'

import { Cmd } from './Cmd.tsx'

/** Whether this browser is paired, so its owner moves run; the gate decides it, and the layout passes it down. */
const Paired = createContext(false)

export const PAIR_HINT = 'Pair this browser to run your moves: nook web pair'

export function Owner({ paired = false, children }: { paired?: boolean; children: ReactNode }) {
  return <Paired.Provider value={paired}>{children}</Paired.Provider>
}

export const usePaired = () => useContext(Paired)

/** The line under the top bar of a browser with no pair: the pages read, the moves wait for a pair. */
export function ViewerNote() {
  if (usePaired()) return null
  return (
    <p className="nk-viewer">
      <b>View only.</b> To run your moves here, run <Cmd text="nook web pair" /> in your terminal and open its link in this browser.
    </p>
  )
}
