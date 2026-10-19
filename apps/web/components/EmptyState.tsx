import type { ReactNode } from 'react'

import { Icon, type IconName } from '@/components/Icon.tsx'

/** A place with nothing in it yet: what is missing, and what to type to fill it. `compact` fits inside a section. */
export function EmptyState({ icon, title, children, compact = false }: { icon: IconName; title: string; children?: ReactNode; compact?: boolean }) {
  return (
    <div className="nk-emptystate" data-size={compact ? 'compact' : undefined}>
      <span className="nk-emptystate__icon">
        <Icon name={icon} />
      </span>
      <div className="nk-emptystate__text">
        <p className="nk-emptystate__title">{title}</p>
        {children ? <p className="nk-emptystate__body">{children}</p> : null}
      </div>
    </div>
  )
}
