'use client'

import { type ReactNode, useActionState } from 'react'

import { Alert, AlertDescription } from '@nook/ui/components/alert.tsx'
import { cn } from '@nook/ui/lib/utils.ts'

import { ownerMove } from '@/app/actions.ts'
import { PAIR_HINT, usePaired } from '@/components/owner.tsx'

/**
 * A form that runs one owner move through the CLI. Its fields name the move; its children are the buttons and inputs.
 * A refused move shows the lines of the CLI under them; a move that went through refreshes the page through /live.
 * A browser with no pair gets the buttons off: the gate refuses its moves. `grow` lets the controls take the width of the row.
 */
export function Move({ fields, children, className, grow = false }: { fields: Record<string, string>; children: ReactNode; className?: string; grow?: boolean }) {
  const [result, act, pending] = useActionState(ownerMove, null)
  const paired = usePaired()
  return (
    <form action={act} className={cn('contents', className)} title={paired ? undefined : PAIR_HINT}>
      {Object.entries(fields).map(([name, value]) => (
        <input type="hidden" name={name} value={value} key={name} />
      ))}
      <fieldset className={cn('m-0 flex min-w-0 items-center gap-1.5 border-0 p-0 disabled:opacity-60', grow && 'flex-1')} disabled={pending || !paired}>
        {children}
      </fieldset>
      {result && !result.ok ? (
        <Alert tone="danger" role="alert" className="basis-full">
          <AlertDescription className="font-mono text-[12.5px] leading-[19px] text-danger">
            {result.lines.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </AlertDescription>
        </Alert>
      ) : null}
    </form>
  )
}
