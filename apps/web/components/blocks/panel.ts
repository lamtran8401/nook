import type { PanelTone } from '@/lib/blocks.ts'

/** The look of each panel of a document: the tone of the kit, the icon and the label. */
export const PANEL: Record<PanelTone, { tone: string; icon: string; label: string }> = {
  info: { tone: 'primary', icon: 'i', label: 'Info' },
  note: { tone: 'neutral', icon: '✎', label: 'Note' },
  success: { tone: 'success', icon: '✓', label: 'Success' },
  warning: { tone: 'warning', icon: '!', label: 'Warning' },
  error: { tone: 'danger', icon: '×', label: 'Error' },
}
