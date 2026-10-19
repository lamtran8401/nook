import type { ReactNode } from 'react'

import { EvError } from '@nook/shared/errors.ts'

import { Alert } from '@/components/Alert.tsx'

/** A gap of the desk, such as a ledger that needs a migration, with its fix, in place of the data of a page. */
export function Gap({ error }: { error: EvError }) {
  return (
    <Alert tone="warning" icon="!" label={error.message.charAt(0).toUpperCase() + error.message.slice(1)}>
      {error.fix ? `Fix: ${error.fix}` : null}
    </Alert>
  )
}

/** The page that a read renders, or the gap of the desk that stops the read. */
export function orGap(render: () => ReactNode): ReactNode {
  try {
    return render()
  } catch (error) {
    if (error instanceof EvError) return <Gap error={error} />
    throw error
  }
}
