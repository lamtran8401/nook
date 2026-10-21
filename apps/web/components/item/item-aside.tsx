import { FileText, Play } from 'lucide-react'

import type { DocName, ItemDocs, ItemView } from '@nook/engineering/read/reader.ts'
import { Detail, DetailList } from '@nook/ui/components/detail-list.tsx'
import { LinkList } from '@nook/ui/components/link-list.tsx'
import { Tile } from '@nook/ui/components/tile.tsx'
import { ToggleGroup, ToggleGroupItem } from '@nook/ui/components/toggle-group.tsx'

import { AreaTags } from '@/components/areas.tsx'
import { Move } from '@/components/item/move.tsx'
import { KindIcon } from '@/components/marks.tsx'
import { day, span } from '@/lib/time.ts'

const MODE_TITLE = { normal: 'Each stage waits for its skill', yolo: 'The lead runs the stages alone' } as const

export const DOC_ABOUT: Record<DocName, { file: string; about: string }> = {
  spec: { file: 'spec.md', about: 'why, what changes, the criteria' },
  'root-cause': { file: 'root-cause.md', about: 'the type and the analysis' },
  plan: { file: 'plan.md', about: 'today, approach, proof, risks' },
  tasks: { file: 'tasks.md', about: 'the slices and their order' },
  walkthrough: { file: 'walkthrough', about: 'what changed and how to try it' },
  findings: { file: 'findings.md', about: 'each answer with its evidence' },
}

export const tabHref = (base: string, id: string, tab: string) => (tab === 'overview' ? `${base}/works/${id}` : `${base}/works/${id}?tab=${tab}`)

/** The mode as a switch of the owner: a click runs `nook eng item mode` through the gate, after a confirm. */
function ModeSwitch({ id, mode }: { id: string; mode: string }) {
  return (
    <Move fields={{ kind: 'mode', item: id }}>
      <ToggleGroup type="single" variant="segment" size="xs" spacing={1} value={mode} aria-label="Mode">
        {(['normal', 'yolo'] as const).map(value => (
          // Radix keeps `value` for the toggle state; the button inside carries the field that the form sends
          <ToggleGroupItem key={value} value={value} asChild className={value === 'yolo' ? 'data-[state=on]:bg-warning-subtle data-[state=on]:text-warning' : undefined}>
            <button type="submit" name="mode" value={value} title={MODE_TITLE[value]}>
              {value}
            </button>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </Move>
  )
}

/** The side of an item page: the facts of the item, and a link to each of its documents. */
export function ItemAside({ view, docs, tab, now, base }: { view: ItemView; docs: ItemDocs; tab: string; now: Date; base: string }) {
  const { item } = view
  const branches = [...new Set(view.changes.map(change => change.branch))]
  const since = view.moves.at(-1)?.at
  const created = view.moves[0]?.at
  return (
    <aside className="grid content-start gap-3">
      <Tile title="Details">
        <DetailList>
          <Detail label="Step">{item.state}</Detail>
          <Detail label="Kind">
            <KindIcon kind={item.kind} />
            {item.kind}
          </Detail>
          <Detail label="Size">{item.size}</Detail>
          <Detail label="Points">{item.points === null ? '—' : `${item.points} pt`}</Detail>
          <Detail label="Mode">
            <ModeSwitch id={item.id} mode={item.mode} />
          </Detail>
          <Detail label="Areas">{item.areas.length ? <AreaTags names={item.areas} /> : '—'}</Detail>
          <Detail label="Branch">{branches.length ? <span className="font-mono text-[12.5px] [overflow-wrap:anywhere]">{branches.join(', ')}</span> : '—'}</Detail>
          <Detail label="In this step">{since ? span(since, now) : '—'}</Detail>
          <Detail label="Created">{created ? day(created) : '—'}</Detail>
        </DetailList>
      </Tile>
      <Tile title="Documents">
        <LinkList
          label="Documents"
          links={docs.map(doc => ({
            href: tabHref(base, item.id, doc.name),
            icon: doc.name === 'walkthrough' ? <Play aria-hidden="true" /> : <FileText aria-hidden="true" />,
            title: DOC_ABOUT[doc.name].file,
            description: doc.text === null ? 'not written yet' : DOC_ABOUT[doc.name].about,
            current: doc.name === tab,
          }))}
        />
      </Tile>
    </aside>
  )
}
