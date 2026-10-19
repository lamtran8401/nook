import type { ReactNode } from 'react'

import { Alert, AlertDescription, AlertMark, AlertTitle } from '@nook/ui/components/alert.tsx'

/** A note in one tone, on the alert of the kit: a mark, a label and a body, such as In short or Need to know. */
export function Callout({ tone, icon, label, children }: { tone: string; icon: ReactNode; label: ReactNode; children?: ReactNode }) {
  return (
    <Alert tone={tone}>
      <AlertMark>{icon}</AlertMark>
      <AlertTitle>{label}</AlertTitle>
      {children ? <AlertDescription>{children}</AlertDescription> : null}
    </Alert>
  )
}
