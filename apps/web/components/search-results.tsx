import { FileText } from 'lucide-react'

import { EmptyState } from '@nook/ui/components/empty-state.tsx'
import { Group, GroupCount, GroupLine } from '@nook/ui/components/group.tsx'

import type { Hit } from '@/lib/search.ts'

/** A line as a reader sees it: no list, heading, quote or table marks at its ends, no bold or code marks. */
const plain = (line: string) => line.replace(/^[\s>#*|-]+/, '').replace(/\s*\|\s*$/, '').replace(/\*\*|`/g, '')

/** The hits in groups by file, in the order that each file first comes. */
function byFile(hits: Hit[]): [string, Hit[]][] {
  const files = new Map<string, Hit[]>()
  for (const hit of hits) files.set(hit.file, [...(files.get(hit.file) ?? []), hit])
  return [...files]
}

const FILE = <FileText className="size-5" aria-hidden="true" />

/** The lines that match the search, under their file, each with its heading, as a link to its page. */
export function SearchResults({ query, hits }: { query: string; hits: Hit[] }) {
  if (!query.trim()) return <EmptyState icon={FILE} title="Search the desk">Type words in the box at the top: the wiki, the work items and the courses.</EmptyState>
  if (!hits.length) return <EmptyState icon={FILE} title={`Nothing holds "${query}"`}>A line matches when it holds every word.</EmptyState>
  return (
    <section className="grid gap-3">
      <h2 className="text-[19px] font-semibold">{hits.length === 1 ? '1 line holds' : `${hits.length} lines hold`} "{query}"</h2>
      <div className="grid gap-2.5">
        {byFile(hits).map(([file, lines]) => (
          <Group key={file} head={<><span className="font-mono text-[13px]">{file}</span><GroupCount n={lines.length} /></>}>
            {lines.map(hit => (
              <GroupLine key={hit.line} mark={<span className="font-mono text-[11px]">L{hit.line}</span>}>
                <a href={hit.href} className="hover:underline">{plain(hit.text)}</a>
                {hit.heading ? <small className="text-[12.5px] text-muted-foreground">{hit.heading}</small> : null}
              </GroupLine>
            ))}
          </Group>
        ))}
      </div>
    </section>
  )
}
