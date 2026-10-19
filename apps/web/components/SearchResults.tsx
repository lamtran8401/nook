import type { Hit } from '@/lib/search.ts'
import { EmptyState } from '@/components/EmptyState.tsx'
import { Count, Group, GroupLine } from '@/components/Group.tsx'

/** A line as a reader sees it: no list, heading, quote or table marks at its ends, no bold or code marks. */
const plain = (line: string) => line.replace(/^[\s>#*|-]+/, '').replace(/\s*\|\s*$/, '').replace(/\*\*|`/g, '')

/** The hits in groups by file, in the order that each file first comes. */
function byFile(hits: Hit[]): [string, Hit[]][] {
  const files = new Map<string, Hit[]>()
  for (const hit of hits) files.set(hit.file, [...(files.get(hit.file) ?? []), hit])
  return [...files]
}

/** The lines that match the search, under their file, each with its heading, as a link to its page. */
export function SearchResults({ query, hits }: { query: string; hits: Hit[] }) {
  if (!query.trim()) return <EmptyState icon="file" title="Search the desk">Type words in the box at the top: the wiki, the work items and the courses.</EmptyState>
  if (!hits.length) return <EmptyState icon="file" title={`Nothing holds "${query}"`}>A line matches when it holds every word.</EmptyState>
  return (
    <section className="nk-sec">
      <h2 className="nk-h2">{hits.length === 1 ? '1 line holds' : `${hits.length} lines hold`} "{query}"</h2>
      <div className="nk-groups">
        {byFile(hits).map(([file, lines]) => (
          <Group key={file} head={<>{file}<Count n={lines.length} /></>}>
            {lines.map(hit => (
              <GroupLine key={hit.line} mark={<span className="nk-line__no">L{hit.line}</span>}>
                <p><a href={hit.href}>{plain(hit.text)}</a></p>
                {hit.heading ? <small>{hit.heading}</small> : null}
              </GroupLine>
            ))}
          </Group>
        ))}
      </div>
    </section>
  )
}
