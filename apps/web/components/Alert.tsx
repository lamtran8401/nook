import type { ReactNode } from 'react'

import type { PanelTone } from '../lib/blocks.ts'

/** The look of each panel tone: the Bench tone, the icon and the label. */
export const PANEL: Record<PanelTone, { tone: string; icon: string; label: string }> = {
  info: { tone: 'primary', icon: 'i', label: 'Info' },
  note: { tone: 'neutral', icon: '✎', label: 'Note' },
  success: { tone: 'success', icon: '✓', label: 'Success' },
  warning: { tone: 'warning', icon: '!', label: 'Warning' },
  error: { tone: 'danger', icon: '×', label: 'Error' },
}

/** The Bench alert: an icon, a label and a body in one tone. */
export function Alert({ tone, icon, label, kind, children }: { tone: string; icon: string; label: string; kind?: string; children?: ReactNode }) {
  return (
    <div className="bn-alert" data-tone={tone} data-kind={kind}>
      <div className="bn-alert__icon">{icon}</div>
      <div>
        <div className="bn-alert__label">{label}</div>
        {children ? <div className="bn-alert__body">{children}</div> : null}
      </div>
    </div>
  )
}
