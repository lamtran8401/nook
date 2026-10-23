import { Bug, FileText } from 'lucide-react'

import type { DocName } from '@nook/engineering/read/reader.ts'
import type { Criterion } from '@nook/engineering/stores/criteria.ts'
import type { Item } from '@nook/engineering/stores/items.ts'
import type { Slice } from '@nook/engineering/stores/slices.ts'
import { Callout } from '@nook/ui/components/callout.tsx'
import { CopyCommand } from '@nook/ui/components/copy-command.tsx'
import { DocFrame } from '@nook/ui/components/doc-frame.tsx'
import { EmptyState } from '@nook/ui/components/empty-state.tsx'
import { Prose } from '@nook/ui/components/prose.tsx'
import { Tile } from '@nook/ui/components/tile.tsx'

import { Blocks } from '@/components/blocks/blocks.tsx'
import { DOC_ABOUT } from '@/components/item/item-aside.tsx'
import { Lanes } from '@/components/item/lanes.tsx'
import { SlicesTile } from '@/components/item/overview.tsx'
import { SliceBoard } from '@/components/item/slice-board.tsx'
import { parseDoc } from '@/lib/blocks.ts'

type DocItem = Pick<Item, 'id' | 'areas' | 'state' | 'blocked_from'>

// what writes a document not written yet: the words before the command, and the command to type in the agent session
const WRITES: Record<DocName, [before: string, command: string]> = {
  spec: ['The spec comes first. Type', '/spec'],
  'root-cause': ['The root cause comes with the build of a fix. Type', '/cook'],
  plan: ['The plan comes after the spec. Type', '/recipe'],
  tasks: ['The slices come with the plan. Type', '/recipe'],
  walkthrough: ['The walkthrough comes after the build. When the item reaches review, type', '/view'],
  findings: ['The findings come with the work of the investigation. Type', '/cook'],
}

const ROOT_CAUSE_ABOUT = 'The earliest point where the bug was made. Retro counts each type across the workspace.'

/** The type of a root cause from the front matter of root-cause.md, with the reason of a type that is not known yet. */
function RootCauseType({ meta }: { meta: Record<string, string> }) {
  if (!meta.type) return <Callout tone="neutral" icon={<Bug className="size-3.5" aria-hidden="true" />} label="No type yet">Write the type in the front matter of root-cause.md before the submit.</Callout>
  return (
    <Callout tone="danger" icon={<Bug className="size-3.5" aria-hidden="true" />} label={meta.type}>
      {meta.reason ? `${ROOT_CAUSE_ABOUT} Reason: ${meta.reason}` : ROOT_CAUSE_ABOUT}
    </Callout>
  )
}

/** The slices of the tasks: the bar by state, the board by state and the lanes, before the words of tasks.md. */
function SliceTiles({ slices }: { slices: Slice[] }) {
  if (!slices.some(s => s.state !== 'cancelled')) return null
  return (
    <>
      <SlicesTile slices={slices} />
      <Tile title="Slices by state">
        <SliceBoard slices={slices} />
      </Tile>
      <Lanes slices={slices} />
    </>
  )
}

/**
 * One document of the item on its card, block by block, with what the ledger knows beside it: the criteria with their
 * state, the type of a root cause, and the slices of the tasks first. The page head names the item, so the title of the
 * document is left out. A document not written yet says what writes it.
 */
export function DocTab({ item, name, text, criteria, slices = [] }: { item: DocItem; name: DocName; text: string | null; criteria: Criterion[]; slices?: Slice[] }) {
  if (text === null)
    return (
      <EmptyState icon={<FileText className="size-5" aria-hidden="true" />} title={`The ${name} is not written yet`}>
        {WRITES[name][0]} <CopyCommand text={`${WRITES[name][1]} ${item.id}`} /> in the agent session.
      </EmptyState>
    )
  const doc = parseDoc(text, { places: item.areas })
  const dates = ['created', 'updated'].filter(key => doc.meta[key]).map(key => `${key} ${doc.meta[key]}`)
  return (
    <>
      {name === 'tasks' ? <SliceTiles slices={slices} /> : null}
      <DocFrame path={`works/${item.id}/${DOC_ABOUT[name].file}`} meta={dates.length ? <span className="font-mono">{dates.join(' · ')}</span> : null}>
        {name === 'root-cause' ? <RootCauseType meta={doc.meta} /> : null}
        <Prose>
          <Blocks blocks={doc.blocks} context={{ criteria, slices, item }} />
        </Prose>
      </DocFrame>
    </>
  )
}
