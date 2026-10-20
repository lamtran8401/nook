import type { PageView } from '@nook/wiki/read.ts'
import { Badge } from '@nook/ui/components/badge.tsx'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@nook/ui/components/breadcrumb.tsx'
import { Callout } from '@nook/ui/components/callout.tsx'
import { Prose } from '@nook/ui/components/prose.tsx'
import { RecordList } from '@nook/ui/components/record-list.tsx'
import { Section } from '@nook/ui/components/section.tsx'

import { Blocks } from '@/components/blocks/blocks.tsx'
import { PANEL } from '@/components/blocks/panel.ts'
import { parseDoc } from '@/lib/blocks.ts'

/** One page of the wiki, block by block, with each link it makes; a draft says that it waits for the owner's yes. */
export function WikiPage({ page, base }: { page: PageView; base: string }) {
  // the address of each [[name]] that the wiki knows, so the page links it like a Markdown link
  const links = Object.fromEntries(page.links.flatMap(l => (l.target && l.link.startsWith('[[') ? [[l.link.slice(2, -2), `${base}/wiki/${l.target}`]] : [])))
  const doc = parseDoc(page.text, { links })
  const [shelf] = page.path.split('/')
  const draft = shelf === 'drafts'
  return (
    <article className="mx-auto grid w-full max-w-[920px] gap-3">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href={`${base}/wiki`}>Wiki</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>{draft ? <BreadcrumbPage>drafts</BreadcrumbPage> : <BreadcrumbLink href={`${base}/wiki/${shelf}`}>{shelf}</BreadcrumbLink>}</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>{page.path.split('/').at(-1)}</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      {draft ? (
        <Callout {...PANEL.note} label="A draft">
          It waits for your yes. Say yes in the agent session, and the page joins its shelf.
        </Callout>
      ) : null}
      <p className="font-mono text-xs text-muted-foreground">{[`docs/wiki/${page.path}`, ...['type', 'updated'].filter(k => doc.meta[k]).map(k => `${k} ${doc.meta[k]}`)].join(' · ')}</p>
      {doc.title ? <h1 className="text-3xl font-bold tracking-tight text-balance">{doc.title}</h1> : null}
      <Prose>
        <Blocks blocks={doc.blocks} />
      </Prose>
      {page.links.length ? (
        <Section title="Links">
          <RecordList
            rows={page.links.map(link => ({
              id: link.target ? 'page' : 'none',
              main: link.target ? <a href={`${base}/wiki/${link.target}`} className="hover:underline">{link.link}</a> : link.link,
              end: link.target ? undefined : <Badge tone="danger">no such page</Badge>,
            }))}
          />
        </Section>
      ) : null}
    </article>
  )
}
