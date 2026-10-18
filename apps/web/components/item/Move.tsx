'use client'

import { type ReactNode, useActionState } from 'react'

import { ownerMove } from '../../app/actions.ts'
import { PAIR_HINT, usePaired } from '../Owner.tsx'

/**
 * A form that runs one owner move through the CLI. Its fields name the move; its children are the buttons and inputs.
 * A refused move shows the lines of the CLI under them; a move that went through refreshes the page through /live.
 * A browser with no pair gets the buttons off: the gate refuses its moves.
 */
export function Move({ fields, children, className }: { fields: Record<string, string>; children: ReactNode; className?: string }) {
  const [result, act, pending] = useActionState(ownerMove, null)
  const paired = usePaired()
  return (
    <form action={act} className={['nk-move', className].filter(Boolean).join(' ')} title={paired ? undefined : PAIR_HINT}>
      {Object.entries(fields).map(([name, value]) => (
        <input type="hidden" name={name} value={value} key={name} />
      ))}
      <fieldset className="nk-move__controls" disabled={pending || !paired}>{children}</fieldset>
      {result && !result.ok ? (
        <div className="nk-move__refused" role="alert">
          {result.lines.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      ) : null}
    </form>
  )
}
