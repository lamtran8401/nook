import type { ReactNode } from 'react'

import { IconTile } from '@nook/ui/components/icon-tile.tsx'
import { cn } from '@nook/ui/lib/utils.ts'

type IconCardProps = { href?: string; icon: ReactNode; tone?: string; title: string; description?: string; tags?: ReactNode[]; meta?: ReactNode; className?: string }

/**
 * A small card of the app: a tinted tile with a glyph, a bold title with its tags beside it, and one or two muted
 * lines. With an address the whole card is one link.
 */
export function IconCard({ href, icon, tone = 'neutral', title, description, tags = [], meta, className }: IconCardProps) {
  const body = (
    <>
      <IconTile tone={tone}>{icon}</IconTile>
      <div className="grid min-w-0 gap-0.5">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <h3 className="truncate text-[13.5px] font-semibold">{title}</h3>
          {tags.map((tag, i) => (
            <span key={i} className="rounded-full bg-muted px-2 text-[11px] leading-[18px] font-medium text-muted-foreground">
              {tag}
            </span>
          ))}
          {meta ? <span className="ml-auto shrink-0 font-mono text-[11.5px] text-muted-foreground">{meta}</span> : null}
        </div>
        {description ? <p className="line-clamp-2 text-[12.5px] leading-[18px] text-muted-foreground">{description}</p> : null}
      </div>
    </>
  )
  const style = cn('grid grid-cols-[32px_minmax(0,1fr)] items-start gap-3 rounded-md bg-card px-3.5 py-3 shadow-xs', className)
  return href ? (
    <a data-slot="icon-card" href={href} className={cn(style, 'outline-offset-2 hover:bg-muted/40 focus-visible:outline-2')}>
      {body}
    </a>
  ) : (
    <article data-slot="icon-card" className={style}>
      {body}
    </article>
  )
}
