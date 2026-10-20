import type { ReactNode } from 'react'

import { IconTile } from '@nook/ui/components/icon-tile.tsx'
import { cn } from '@nook/ui/lib/utils.ts'

type IconCardProps = { href?: string; icon: ReactNode; tone?: string; title: string; description?: string; tags?: ReactNode[]; meta?: ReactNode; className?: string }

/**
 * A card of the app: a pastel tile with a colored glyph, a bold title, two muted lines, and tag pills. With an address
 * the whole card is one link.
 */
export function IconCard({ href, icon, tone = 'neutral', title, description, tags = [], meta, className }: IconCardProps) {
  const body = (
    <>
      <div className="flex items-center gap-3">
        <IconTile tone={tone} className="size-10 [&_svg]:size-5">
          {icon}
        </IconTile>
        <h3 className="min-w-0 flex-1 truncate text-[16px] font-semibold">{title}</h3>
        {meta ? <span className="shrink-0 font-mono text-xs text-muted-foreground">{meta}</span> : null}
      </div>
      {description ? <p className="line-clamp-2 text-[14px] leading-[21px] text-muted-foreground">{description}</p> : null}
      {tags.length ? (
        <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
          {tags.map((tag, i) => (
            <span key={i} className="rounded-full bg-muted px-2.5 py-[3px] text-[12.5px] text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </>
  )
  const style = cn('flex flex-col gap-2.5 rounded-[18px] bg-card p-4 shadow-[var(--shadow-1)]', className)
  return href ? (
    <a data-slot="icon-card" href={href} className={cn(style, 'outline-offset-2 focus-visible:outline-2')}>
      {body}
    </a>
  ) : (
    <article data-slot="icon-card" className={style}>
      {body}
    </article>
  )
}
