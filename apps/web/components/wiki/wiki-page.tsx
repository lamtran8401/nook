import type { PageView } from '@nook/wiki/read.ts'
import { Badge } from '@nook/ui/components/badge.tsx'
import { Callout } from '@nook/ui/components/callout.tsx'
import { Prose } from '@nook/ui/components/prose.tsx'
import { RecordList } from '@nook/ui/components/record-list.tsx'
import { Tile } from '@nook/ui/components/tile.tsx'

import { Blocks } from '@/components/blocks/blocks.tsx'
import { PANEL } from '@/components/blocks/panel.ts'
import { parseDoc } from '@/lib/blocks.ts'

/** One page of the wiki, block by block, with each link it makes; a draft says that it waits for the owner's yes. */
export function WikiPage({ page, base }: { page: PageView; base: string }) {
  // the address of each [[name]] that the wiki knows, so the page links it like a Markdown link
  const links = Object.fromEntries(page.links.flatMap(l => (l.target && l.link.startsWith('[[') ? [[l.link.slice(2, -2), `${base}/wiki/${l.target}`]] : [])))
  const doc = parseDoc(page.text, { links })
  const draft = page.path.startsWith('drafts/')
  return (
    <>
      {draft ? (
        <Callout {...PANEL.note} label="A draft">
          It waits for your yes. Say yes in the agent session, and the page joins its shelf.
        </Callout>
      ) : null}
      <article className="grid gap-3">
        {doc.title ? <h1 className="text-[22px] leading-7 font-semibold tracking-tight text-balance">{doc.title}</h1> : null}
        <p className="font-mono text-xs text-muted-foreground">{[`docs/wiki/${page.path}`, ...['type', 'updated'].filter(k => doc.meta[k]).map(k => `${k} ${doc.meta[k]}`)].join(' · ')}</p>
        <Prose>
          <Blocks blocks={doc.blocks} />
        </Prose>
      </article>
      {page.links.length ? (
        <Tile title="Links" note={page.links.length}>
          <RecordList
            rows={page.links.map(link => ({
              id: link.target ? 'page' : 'none',
              main: link.target ? <a href={`${base}/wiki/${link.target}`} className="hover:underline">{link.link}</a> : link.link,
              end: link.target ? undefined : <Badge tone="danger">no such page</Badge>,
            }))}
          />
        </Tile>
      ) : null}
    </>
  )
}
