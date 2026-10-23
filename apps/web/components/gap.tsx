import type { ReactNode } from 'react'

import { EvError } from '@nook/shared/errors.ts'

import { Callout } from '@nook/ui/components/callout.tsx'

/** A gap of the workspace, such as a ledger that needs a migration, with its fix, in place of the data of a page. */
export function Gap({ error }: { error: EvError }) {
  return (
    <Callout tone="warning" icon="!" label={error.message.charAt(0).toUpperCase() + error.message.slice(1)}>
      {error.fix ? `Fix: ${error.fix}` : null}
    </Callout>
  )
}

/** The page that a read renders, or the gap of the workspace that stops the read. */
export function orGap(render: () => ReactNode): ReactNode {
  try {
    return render()
  } catch (error) {
    if (error instanceof EvError) return <Gap error={error} />
    throw error
  }
}
