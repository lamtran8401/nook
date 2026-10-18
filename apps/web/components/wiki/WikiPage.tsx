import type { PageView } from '@nook/wiki/read.ts'

import { parseDoc } from '../../lib/blocks.ts'
import { Alert, PANEL } from '../Alert.tsx'
import { Blocks } from '../blocks/Blocks.tsx'
import { Records } from '../Records.tsx'

/** One page of the wiki, block by block, with each link it makes; a draft says that it waits for the owner's yes. */
export function WikiPage({ page }: { page: PageView }) {
  // the address of each [[name]] that the wiki knows, so the page links it like a Markdown link
  const links = Object.fromEntries(page.links.flatMap(l => (l.target && l.link.startsWith('[[') ? [[l.link.slice(2, -2), `/wiki/${l.target}`]] : [])))
  const doc = parseDoc(page.text, { links })
  const [shelf] = page.path.split('/')
  const draft = shelf === 'drafts'
  return (
    <article className="nk-doc nk-page">
      <ol className="bn-breadcrumb">
        <li><a href="/wiki">Wiki</a></li>
        {draft ? <li><span>drafts</span></li> : <li><a href={`/wiki/${shelf}`}>{shelf}</a></li>}
        <li><span aria-current="page">{page.path.split('/').at(-1)}</span></li>
      </ol>
      {draft ? (
        <Alert {...PANEL.note} label="A draft">
          It waits for your yes. Say yes in the agent session, and the page joins its shelf.
        </Alert>
      ) : null}
      <p className="nk-doc__meta">{[`docs/wiki/${page.path}`, ...['type', 'updated'].filter(k => doc.meta[k]).map(k => `${k} ${doc.meta[k]}`)].join(' · ')}</p>
      {doc.title ? <h1 className="nk-head__title">{doc.title}</h1> : null}
      <div className="nk-doc__body">
        <Blocks blocks={doc.blocks} />
      </div>
      {page.links.length ? (
        <section className="nk-sec">
          <h2 className="nk-h2">Links</h2>
          <Records
            rows={page.links.map(link => ({
              id: link.target ? 'page' : 'none',
              main: link.target ? <a href={`/wiki/${link.target}`}>{link.link}</a> : link.link,
              end: link.target ? undefined : <span className="bn-badge" data-tone="danger">no such page</span>,
            }))}
          />
        </section>
      ) : null}
    </article>
  )
}
