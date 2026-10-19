import type { ItemView } from '@nook/engineering/read/reader.ts'

import { clock, day } from '@/lib/time.ts'
import { ItemChips } from '@/components/item/ItemChips.tsx'
import { Move } from '@/components/item/Move.tsx'

/** The head of an item page: the way back to the board, the title, the chips with the mode, which the owner can switch, and the key moments. */
export function ItemHeader({ view }: { view: ItemView }) {
  const { item, moves } = view
  const last = (move: string) => moves.findLast(m => m.move === move)?.at
  const started = last('start')
  const approved = last('approve')
  const sentBack = moves.filter(m => m.move === 'reject').length
  return (
    <header className="nk-head">
      <ol className="bn-breadcrumb">
        <li><a href="/works">Works</a></li>
        <li><span aria-current="page">{item.id}</span></li>
      </ol>
      <h1 className="nk-head__title">{item.title}</h1>
      <ItemChips item={item}>
        <Move fields={{ kind: 'mode', item: item.id }} className="nk-mode">
          {(['normal', 'yolo'] as const).map(mode => (
            <button type="submit" name="mode" value={mode} key={mode} aria-pressed={item.mode === mode} title={mode === 'yolo' ? 'The lead runs the stages alone' : 'Each stage waits for its skill'}>
              {mode}
            </button>
          ))}
        </Move>
      </ItemChips>
      <p className="nk-keys">
        {started ? <span>Started<b>{day(started)}</b></span> : null}
        {approved ? <span>Approved<b>{day(approved)} {clock(approved)}</b></span> : null}
        {sentBack ? <span>Sent back<b>{sentBack}×</b></span> : null}
      </p>
    </header>
  )
}
