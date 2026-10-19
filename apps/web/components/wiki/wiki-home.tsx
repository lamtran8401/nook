import { FileText } from 'lucide-react'

import type { ShelfView, WikiView } from '@nook/wiki/read.ts'
import { CopyCommand } from '@nook/ui/components/copy-command.tsx'
import { EmptyState } from '@nook/ui/components/empty-state.tsx'
import { Group, GroupCount, GroupLine } from '@nook/ui/components/group.tsx'
import { InlineCode } from '@nook/ui/components/inline-code.tsx'
import { Badge } from '@nook/ui/components/badge.tsx'

import { PAGE_TYPE_TONE } from '@/components/tones.ts'

// `payment-retries.md` reads as `Payment retries`
const title = (path: string) => {
  const words = path.replace(/\.md$/, '').split('/').at(-1)!.replace(/-/g, ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

const PAGE_MARK = <FileText className="size-4" aria-hidden="true" />
const tag = (type: string) => <Badge variant="label" tone={PAGE_TYPE_TONE[type] ?? 'neutral'}>{type}</Badge>

function PageLine({ href, page, sub, type }: { href: string; page: string; sub: string; type?: string }) {
  return (
    <GroupLine mark={PAGE_MARK} end={type ? tag(type) : undefined}>
      <a href={href} className="hover:underline">{title(page)}</a>
      <small className="text-[12.5px] text-muted-foreground">{sub}</small>
    </GroupLine>
  )
}

/** A shelf as a group: its name, its count and its use on top, then a line for each page with its summary and type. */
function Shelf({ shelf }: { shelf: ShelfView }) {
  const head = (
    <>
      <b className="font-semibold">{shelf.name}</b>
      <GroupCount n={shelf.lines.length} />
      <span className="min-w-0 truncate text-[13px] font-normal text-muted-foreground">{shelf.use}</span>
    </>
  )
  return (
    <Group head={head} href={`/wiki/${shelf.name}`}>
      {shelf.lines.length ? (
        shelf.lines.map(line => <PageLine key={line.page} href={`/wiki/${shelf.name}/${line.page}`} page={line.page} sub={line.summary} type={line.type || undefined} />)
      ) : (
        <GroupLine>
          <p className="text-muted-foreground"><b className="font-semibold text-foreground">No page yet.</b> A page joins the shelf after your yes to its draft.</p>
        </GroupLine>
      )}
    </Group>
  )
}

/** The wiki: the drafts that wait for a yes first, then each shelf with the lines of its index. */
export function WikiHome({ wiki }: { wiki: WikiView | null }) {
  if (!wiki) return <EmptyState icon={<FileText className="size-5" aria-hidden="true" />} title="This desk has no wiki">Add <InlineCode>wiki</InlineCode> to the packs of nook.yml, then run <CopyCommand text="/setup" /> in the agent session.</EmptyState>
  return (
    <div className="grid gap-2.5">
      {wiki.drafts.length ? (
        <Group head={<><b className="font-semibold">Drafts that wait for your yes</b><GroupCount n={wiki.drafts.length} /></>}>
          {wiki.drafts.map(draft => <PageLine key={draft} href={`/wiki/drafts/${draft}`} page={draft} sub={`drafts/${draft}`} type="draft" />)}
        </Group>
      ) : null}
      {wiki.shelves.map(shelf => (
        <Shelf key={shelf.name} shelf={shelf} />
      ))}
    </div>
  )
}

/** One shelf alone, as `/wiki/resources` shows it. */
export function ShelfPage({ shelf }: { shelf: ShelfView }) {
  return (
    <>
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <a href="/wiki" className="hover:text-foreground">Wiki</a>
        <span aria-hidden="true">/</span>
        <span className="text-foreground" aria-current="page">{shelf.name}</span>
      </nav>
      <Shelf shelf={shelf} />
    </>
  )
}
