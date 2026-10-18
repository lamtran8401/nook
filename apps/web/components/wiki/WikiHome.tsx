import type { ShelfView, WikiView } from '@nook/wiki/read.ts'

import { EmptyState } from '../EmptyState.tsx'
import { Records } from '../Records.tsx'

// `payment-retries.md` reads as `Payment retries`
const title = (path: string) => {
  const words = path.replace(/\.md$/, '').split('/').at(-1)!.replace(/-/g, ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

function Shelf({ shelf }: { shelf: ShelfView }) {
  return (
    <section className="nk-sec" id={shelf.name}>
      <h2 className="nk-h2">
        <a href={`/wiki/${shelf.name}`}>{shelf.name}</a>
      </h2>
      <p className="nk-muted">{shelf.use}</p>
      {shelf.lines.length ? (
        <Records
          rows={shelf.lines.map(line => ({
            id: line.type || 'page',
            main: <a href={`/wiki/${shelf.name}/${line.page}`}>{title(line.page)}</a>,
            sub: line.summary,
          }))}
        />
      ) : (
        <EmptyState compact icon="file" title="No page yet">A page joins the shelf after your yes to its draft.</EmptyState>
      )}
    </section>
  )
}

/** The wiki: the drafts that wait for a yes first, then each shelf with the lines of its index. */
export function WikiHome({ wiki }: { wiki: WikiView | null }) {
  if (!wiki) return <EmptyState icon="file" title="This desk has no wiki">Add <code className="bn-inline-code">wiki</code> to the packs of nook.yml, then run /setup in the agent session.</EmptyState>
  return (
    <>
      {wiki.drafts.length ? (
        <section className="nk-sec">
          <h2 className="nk-h2">Drafts that wait for your yes</h2>
          <Records rows={wiki.drafts.map(draft => ({ id: 'draft', main: <a href={`/wiki/drafts/${draft}`}>{title(draft)}</a>, sub: `drafts/${draft}` }))} />
        </section>
      ) : null}
      {wiki.shelves.map(shelf => (
        <Shelf key={shelf.name} shelf={shelf} />
      ))}
    </>
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
