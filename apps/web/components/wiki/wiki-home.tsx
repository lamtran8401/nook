import type { ShelfView, WikiView } from '@nook/wiki/read.ts'

import { Cmd } from '@/components/cmd.tsx'
import { EmptyState } from '@/components/empty-state.tsx'
import { Count, Group, GroupLine } from '@/components/group.tsx'
import { Icon } from '@/components/icon.tsx'
import { PAGE_TYPE_TONE } from '@/components/tones.ts'

// `payment-retries.md` reads as `Payment retries`
const title = (path: string) => {
  const words = path.replace(/\.md$/, '').split('/').at(-1)!.replace(/-/g, ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

const PAGE_MARK = <span className="nk-line__mark"><Icon name="file" size={16} /></span>
const tag = (type: string) => <span className="nk-tag" data-tone={PAGE_TYPE_TONE[type] ?? 'neutral'}>{type}</span>

/** A shelf as a group: its name, its count and its use on top, then a line for each page with its summary and type. */
function Shelf({ shelf }: { shelf: ShelfView }) {
  const head = (
    <>
      <b className="nk-group__title">{shelf.name}</b>
      <Count n={shelf.lines.length} />
      <span className="nk-group__note">{shelf.use}</span>
    </>
  )
  return (
    <Group head={head} href={`/wiki/${shelf.name}`}>
      {shelf.lines.length ? (
        shelf.lines.map(line => (
          <GroupLine key={line.page} mark={PAGE_MARK} end={line.type ? tag(line.type) : undefined}>
            <p><a href={`/wiki/${shelf.name}/${line.page}`}>{title(line.page)}</a></p>
            <small>{line.summary}</small>
          </GroupLine>
        ))
      ) : (
        <GroupLine>
          <p className="nk-line__none"><b>No page yet.</b> A page joins the shelf after your yes to its draft.</p>
        </GroupLine>
      )}
    </Group>
  )
}

/** The wiki: the drafts that wait for a yes first, then each shelf with the lines of its index. */
export function WikiHome({ wiki }: { wiki: WikiView | null }) {
  if (!wiki) return <EmptyState icon="file" title="This desk has no wiki">Add <code className="bn-inline-code">wiki</code> to the packs of nook.yml, then run <Cmd text="/setup" /> in the agent session.</EmptyState>
  return (
    <div className="nk-groups">
      {wiki.drafts.length ? (
        <Group head={<><b className="nk-group__title">Drafts that wait for your yes</b><Count n={wiki.drafts.length} /></>}>
          {wiki.drafts.map(draft => (
            <GroupLine key={draft} mark={PAGE_MARK} end={tag('draft')}>
              <p><a href={`/wiki/drafts/${draft}`}>{title(draft)}</a></p>
              <small>drafts/{draft}</small>
            </GroupLine>
          ))}
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
      <ol className="bn-breadcrumb">
        <li><a href="/wiki">Wiki</a></li>
        <li><span aria-current="page">{shelf.name}</span></li>
      </ol>
      <Shelf shelf={shelf} />
    </>
  )
}
