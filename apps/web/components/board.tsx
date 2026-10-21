import { Inbox } from 'lucide-react'
import type { BoardCard } from '@nook/engineering/read/reader.ts'

import { Badge } from '@nook/ui/components/badge.tsx'
import { EmptyState } from '@nook/ui/components/empty-state.tsx'
import { FlowLane } from '@nook/ui/components/flow-lane.tsx'
import { Frame } from '@nook/ui/components/frame.tsx'
import { ItemCard } from '@nook/ui/components/item-card.tsx'
import { ItemGroup, ItemRow } from '@nook/ui/components/item-list.tsx'
import { LinkTabs } from '@nook/ui/components/link-tabs.tsx'
import { StepBar } from '@nook/ui/components/step-bar.tsx'

import { KindIcon, StateTag } from '@/components/marks.tsx'
import {
  BACKLOG,
  backlogOf,
  type BoardOptions,
  boardHref,
  FLOW,
  holderGroups,
  KINDS,
  laneOf,
  type Phase,
  phaseColumns,
  phaseGroups,
  pointsOf,
  stepOf,
  visibleCards,
} from '@/lib/board.ts'
import { turnTitle } from '@/lib/turn.ts'

const capital = (word: string) => word.charAt(0).toUpperCase() + word.slice(1)
const needsOwner = (card: BoardCard) => card.next.owner && stepOf(card) !== 'done'

function YoloChip() {
  return (
    <Badge tone="warning" title="The lead runs this item with no stop at your moves">
      yolo
    </Badge>
  )
}

/** One item as a card: the next move is its flag line, unless a blocking question or a failed slice holds it. */
function Card({ card, base }: { card: BoardCard; base: string }) {
  const step = stepOf(card)
  const { done, total } = card.slices
  return (
    <ItemCard
      href={`${base}/works/${card.id}`}
      kind={<KindIcon kind={card.kind} />}
      id={card.id}
      points={card.points}
      mode={card.mode === 'yolo' ? <YoloChip /> : null}
      areas={card.areas}
      title={card.title}
      steps={<StepBar count={FLOW.length} at={FLOW.indexOf(step)} finished={step === 'done'} />}
      flag={step === 'done' ? null : (card.flags[0] ?? turnTitle(card.next).replace(` ${card.id}`, ''))}
      end={total ? `${done}/${total}` : null}
      needs={needsOwner(card)}
    />
  )
}

const emptyText = (kind: string, phase: string) => (kind === 'all' ? `No item in ${phase}` : `No ${kind} items in ${phase}`)

function stepChips(phase: Phase, cards: BoardCard[]) {
  if (phase.steps.length < 2) return null
  return phase.steps.map(step => (
    <Badge key={step} variant="outline" className="bg-surface">
      {step} {cards.filter(card => stepOf(card) === step).length}
    </Badge>
  ))
}

function PhaseFrame({ phase, cards, kind, base, layout = 'column' }: { phase: Phase; cards: BoardCard[]; kind: string; base: string; layout?: 'column' | 'grid' }) {
  return (
    <Frame title={phase.name} tone={phase.tone} count={cards.length} points={pointsOf(cards)} about={phase.about} chips={stepChips(phase, cards)} layout={layout} empty={emptyText(kind, phase.name)}>
      {cards.length ? cards.map(card => <Card key={card.id} card={card} base={base} />) : null}
    </Frame>
  )
}

function PhaseBoard({ cards, kind, base }: { cards: BoardCard[]; kind: string; base: string }) {
  return (
    <>
      <div className="grid grid-cols-4 items-start gap-3 max-[1099px]:grid-cols-2 max-[599px]:grid-cols-1">
        {phaseColumns(cards).map(({ phase, cards: held }) => (
          <PhaseFrame key={phase.name} phase={phase} cards={held} kind={kind} base={base} />
        ))}
      </div>
      <PhaseFrame phase={BACKLOG} cards={backlogOf(cards)} kind={kind} base={base} layout="grid" />
    </>
  )
}

function HolderBoard({ cards, base }: { cards: BoardCard[]; base: string }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] items-start gap-3">
      {holderGroups(cards).map(({ holder, cards: held }) => (
        <Frame key={holder.key} title={holder.title} tone={holder.tone} count={held.length} points={pointsOf(held)} about={holder.about}>
          {held.map(card => (
            <Card key={card.id} card={card} base={base} />
          ))}
        </Frame>
      ))}
    </div>
  )
}

/** One row of the list; opened, it names the next move and links to the item and its spec. */
function Row({ card, base }: { card: BoardCard; base: string }) {
  const href = `${base}/works/${card.id}`
  const link = 'font-medium text-primary underline-offset-2 hover:underline'
  return (
    <ItemRow
      kind={<KindIcon kind={card.kind} />}
      id={card.id}
      title={card.title}
      needs={needsOwner(card)}
      marks={
        <>
          {card.mode === 'yolo' ? <YoloChip /> : null}
          {card.points === null ? null : <span className="tabular-nums">{card.points} pt</span>}
          <StateTag state={card.state} />
        </>
      }
    >
      <span className="font-medium">{turnTitle(card.next)}</span>
      {card.flags.map(flag => (
        <span key={flag} className="font-medium text-danger">
          {flag}
        </span>
      ))}
      <a className={link} href={href}>
        Open the item
      </a>
      <a className={link} href={`${href}?tab=spec`}>
        Read the spec
      </a>
    </ItemRow>
  )
}

function ItemList({ cards, group, base }: { cards: BoardCard[]; group: BoardOptions['group']; base: string }) {
  const groups =
    group === 'holder'
      ? holderGroups(cards).map(({ holder, cards: held }) => ({ key: holder.key, title: holder.title, tone: holder.tone, cards: held }))
      : phaseGroups(cards).map(({ phase, cards: held }) => ({ key: phase.name, title: phase.name, tone: phase.tone, cards: held }))
  return (
    <div className="flex flex-col gap-3">
      {groups.map(({ key, title, tone, cards: held }) => (
        <ItemGroup key={key} title={title} tone={tone} count={held.length} points={pointsOf(held)}>
          {held.map(card => (
            <Row key={card.id} card={card} base={base} />
          ))}
        </ItemGroup>
      ))}
    </div>
  )
}

/** The items of the desk: the lane that counts each phase, a filter of kinds, then the layout that the Display menu chose. */
export function Board({ cards, options, base }: { cards: BoardCard[]; options: BoardOptions; base: string }) {
  if (!cards.length) return <EmptyState icon={<Inbox className="size-5" aria-hidden="true" />} title="No item yet">Type /intake in the agent session to start one.</EmptyState>
  const shown = visibleCards(cards, options.kind)
  const kinds = KINDS.map(kind => ({ href: boardHref(base, options, { kind }), label: capital(kind), current: kind === options.kind }))
  return (
    <div className="flex flex-col gap-4">
      <FlowLane parts={laneOf(shown)} />
      <LinkTabs tabs={kinds} label="Kinds of items" variant="segment" />
      {options.layout === 'list' ? (
        <ItemList cards={shown} group={options.group} base={base} />
      ) : options.group === 'holder' ? (
        <HolderBoard cards={shown} base={base} />
      ) : (
        <PhaseBoard cards={shown} kind={options.kind} base={base} />
      )}
    </div>
  )
}
