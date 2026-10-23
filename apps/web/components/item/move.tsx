'use client'

import { usePathname } from 'next/navigation'
import { type FormEvent, type ReactNode, useActionState, useRef, useState } from 'react'

import { Alert, AlertDescription } from '@nook/ui/components/alert.tsx'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@nook/ui/components/alert-dialog.tsx'
import { cn } from '@nook/ui/lib/utils.ts'

import { ownerMove } from '@/app/actions.ts'
import { PAIR_HINT, usePaired } from '@/components/owner.tsx'
import { type Confirm, confirmOf } from '@/lib/confirm.ts'

type Waiting = { confirm: Confirm; submitter: HTMLElement | null }

/**
 * A form that runs one owner move through the CLI. Its fields name the move; its children are the buttons and inputs.
 * Each move asks first: the first submit opens a confirm step, and its button sends the form again with the same
 * button. A refused move shows the lines of the CLI under them; a move that went through refreshes the page through
 * /live. A browser with no pair gets the buttons off: the gate refuses its moves. `grow` lets the controls fill the row.
 */
export function Move({ fields, children, className, grow = false }: { fields: Record<string, string>; children: ReactNode; className?: string; grow?: boolean }) {
  const [result, act, pending] = useActionState(ownerMove, null)
  const [waiting, setWaiting] = useState<Waiting | null>(null)
  const confirmed = useRef(false)
  const form = useRef<HTMLFormElement>(null)
  const paired = usePaired()
  // the first segment of the address names the workspace of the page, such as /personal/works
  const workspace = (usePathname() ?? '').split('/')[1] ?? ''

  const ask = (event: FormEvent<HTMLFormElement>) => {
    if (confirmed.current) {
      confirmed.current = false
      return
    }
    event.preventDefault()
    const submitter = (event.nativeEvent as SubmitEvent).submitter
    const chosen = Object.fromEntries([...new FormData(event.currentTarget, submitter).entries()].map(([name, value]) => [name, String(value)]))
    setWaiting({ confirm: confirmOf(fields, chosen), submitter })
  }
  const go = () => {
    confirmed.current = true
    form.current?.requestSubmit(waiting?.submitter ?? undefined)
    setWaiting(null)
  }

  return (
    <form ref={form} action={act} onSubmit={ask} className={cn('contents', className)} title={paired ? undefined : PAIR_HINT}>
      {Object.entries({ ...fields, workspace }).map(([name, value]) => (
        <input type="hidden" name={name} value={value} key={name} />
      ))}
      <fieldset className={cn('m-0 flex min-w-0 items-center gap-1.5 border-0 p-0 disabled:opacity-60', grow && 'flex-1')} disabled={pending || !paired}>
        {children}
      </fieldset>
      <AlertDialog open={waiting !== null} onOpenChange={open => (open ? undefined : setWaiting(null))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{waiting?.confirm.title}</AlertDialogTitle>
            <AlertDialogDescription>{waiting?.confirm.body}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={go}>{waiting?.confirm.action}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
