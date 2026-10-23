import { FileText } from 'lucide-react'
import type { ReactNode } from 'react'

/** One document, flat on the sheet: a head line with its path and its facts, such as its dates, then the document. */
export function DocFrame({ path, meta, children }: { path: string; meta?: ReactNode; children: ReactNode }) {
  return (
    <article data-slot="doc-frame" className="min-w-0">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-hairline pb-2.5 text-xs text-muted-foreground">
        <span className="flex min-w-0 items-center gap-1.5 font-mono">
          <FileText className="size-3.5 shrink-0" aria-hidden="true" />
          {path}
        </span>
        {meta ? <span className="ml-auto flex flex-wrap items-center gap-2">{meta}</span> : null}
      </header>
      <div className="grid gap-4 pt-5">{children}</div>
    </article>
  )
}
