import type { ReactNode } from 'react'

/** A bar of thick glass that floats at the foot of the page while it scrolls, such as the moves of the owner at a gate. */
export function FloatBar({ children }: { children: ReactNode }) {
  return <div data-slot="float-bar" className="sticky bottom-3 z-30 flex items-center gap-2 rounded-[14px] bg-[var(--glass-strong)] p-2 shadow-lg backdrop-blur-xl backdrop-saturate-150">{children}</div>
}
