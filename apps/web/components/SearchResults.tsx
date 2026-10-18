import type { Hit } from '../lib/search.ts'
import { EmptyState } from './EmptyState.tsx'
import { Records } from './Records.tsx'

/** The lines that match the search, each with its file and heading, as a link to its page. */
export function SearchResults({ query, hits }: { query: string; hits: Hit[] }) {
  if (!query.trim()) return <EmptyState icon="file" title="Search the desk">Type words in the box at the top: the wiki, the work items and the courses.</EmptyState>
  if (!hits.length) return <EmptyState icon="file" title={`Nothing holds "${query}"`}>A line matches when it holds every word.</EmptyState>
  return (
    <section className="nk-sec">
      <h2 className="nk-h2">{hits.length === 1 ? '1 line holds' : `${hits.length} lines hold`} "{query}"</h2>
      <Records rows={hits.map(hit => ({ id: `L${hit.line}`, main: <a href={hit.href}>{hit.text}</a>, sub: [hit.file, hit.heading].filter(Boolean).join(' · ') }))} />
    </section>
  )
}
