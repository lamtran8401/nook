import { FileText, Library } from 'lucide-react'

import type { ShelfView, WikiView } from '@nook/wiki/read.ts'
import { CopyCommand } from '@nook/ui/components/copy-command.tsx'
import { EmptyState } from '@nook/ui/components/empty-state.tsx'
import { Group, GroupCount, GroupLine } from '@nook/ui/components/group.tsx'
import { IconCard } from '@nook/ui/components/icon-card.tsx'
import { InlineCode } from '@nook/ui/components/inline-code.tsx'
import { Badge } from '@nook/ui/components/badge.tsx'
import { SectionHeader } from '@nook/ui/components/section-header.tsx'
import { TreeNav } from '@nook/ui/components/tree-nav.tsx'

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
function Shelf({ shelf, base }: { shelf: ShelfView; base: string }) {
  const head = (
    <>
      <b className="font-semibold">{shelf.name}</b>
      <GroupCount n={shelf.lines.length} />
      <span className="min-w-0 truncate text-[13px] font-normal text-muted-foreground">{shelf.use}</span>
    </>
  )
  return (
    <Group head={head} href={`${base}/wiki/${shelf.name}`}>
      {shelf.lines.length ? (
        shelf.lines.map(line => <PageLine key={line.page} href={`${base}/wiki/${shelf.name}/${line.page}`} page={line.page} sub={line.summary} type={line.type || undefined} />)
      ) : (
        <GroupLine>
          <p className="text-muted-foreground"><b className="font-semibold text-foreground">No page yet.</b> A page joins the shelf after your yes to its draft.</p>
        </GroupLine>
      )}
    </Group>
  )
}

const SHELF_TONES = ['primary', 'violet', 'aqua', 'warning', 'success']
const count = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

/** The wiki: the drafts that wait for a yes first, then a card for each shelf with its use and its count of pages. */
export function WikiHome({ wiki, base }: { wiki: WikiView | null; base: string }) {
  if (!wiki) return <EmptyState icon={<FileText className="size-5" aria-hidden="true" />} title="This desk has no wiki">Add <InlineCode>wiki</InlineCode> to the packs of nook.yml, then run <CopyCommand text="/setup" /> in the agent session.</EmptyState>
  return (
    <div className="grid gap-5">
      {wiki.drafts.length ? (
        <Group head={<><b className="font-semibold">Drafts that wait for your yes</b><GroupCount n={wiki.drafts.length} /></>}>
          {wiki.drafts.map(draft => <PageLine key={draft} href={`${base}/wiki/drafts/${draft}`} page={draft} sub={`drafts/${draft}`} type="draft" />)}
        </Group>
      ) : null}
      <section className="grid gap-3">
        <SectionHeader title="Shelves" count={wiki.shelves.length} />
        {wiki.shelves.length ? null : <EmptyState icon={<Library className="size-5" aria-hidden="true" />} title="No shelf yet">Run <CopyCommand text="/setup" /> in the agent session: it writes the shelves of the wiki into nook.yml.</EmptyState>}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {wiki.shelves.map((shelf, i) => (
            <IconCard key={shelf.name} href={`${base}/wiki/${shelf.name}`} icon={<Library aria-hidden="true" />} tone={SHELF_TONES[i % SHELF_TONES.length]} title={shelf.name} description={shelf.use} tags={[count(shelf.lines.length, 'page'), ...new Set(shelf.lines.map(l => l.type).filter(Boolean))]} />
          ))}
        </div>
      </section>
    </div>
  )
}

/** The wiki beside its nav: the shelves and their pages on the left, the open part on the right. */
export function WikiLayout({ wiki, current, base, children }: { wiki: WikiView | null; current?: string; base: string; children: React.ReactNode }) {
  if (!wiki?.shelves.length) return <>{children}</>
  const groups = [
    ...(wiki.drafts.length ? [{ title: 'drafts', links: wiki.drafts.map(d => ({ href: `${base}/wiki/drafts/${d}`, label: title(d), current: current === `drafts/${d}` })) }] : []),
    ...wiki.shelves.map(shelf => ({
      title: shelf.name,
      href: `${base}/wiki/${shelf.name}`,
      current: current === shelf.name,
      links: shelf.lines.map(line => ({ href: `${base}/wiki/${shelf.name}/${line.page}`, label: title(line.page), current: current === `${shelf.name}/${line.page}` })),
    })),
  ]
  return (
    <div className="grid items-start gap-3 md:grid-cols-[240px_minmax(0,1fr)]">
      <TreeNav label="Shelves" groups={groups} />
      <div className="grid min-w-0 gap-3">{children}</div>
    </div>
  )
}

/** One shelf alone, as `/wiki/resources` shows it. */
export function ShelfPage({ shelf, base }: { shelf: ShelfView; base: string }) {
  return <Shelf shelf={shelf} base={base} />
}
