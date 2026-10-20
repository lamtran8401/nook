import type { ItemView } from '@nook/engineering/read/reader.ts'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@nook/ui/components/breadcrumb.tsx'
import { ToggleGroup, ToggleGroupItem } from '@nook/ui/components/toggle-group.tsx'

import { ItemChips } from '@/components/item/item-chips.tsx'
import { Move } from '@/components/item/move.tsx'
import { keyMoments } from '@/lib/moments.ts'
import { clock, day } from '@/lib/time.ts'

const MODE_TITLE = { normal: 'Each stage waits for its skill', yolo: 'The lead runs the stages alone' } as const

/** The head of an item page: the way back to the board, the title, the chips with the mode, which the owner can switch, and the key moments. */
export function ItemHeader({ view, base }: { view: ItemView; base: string }) {
  const { item } = view
  const { started, approved, sentBack } = keyMoments(view.moves)
  const keys = [started ? ['Started', day(started)] : null, approved ? ['Approved', `${day(approved)} ${clock(approved)}`] : null, sentBack ? ['Sent back', `${sentBack}×`] : null].filter(k => k !== null)
  return (
    <header className="grid gap-2">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href={`${base}/works`}>Works</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>{item.id}</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <h1 className="text-[28px] leading-9 font-bold tracking-tight text-balance">{item.title}</h1>
      <ItemChips item={item}>
        <Move fields={{ kind: 'mode', item: item.id }}>
          <ToggleGroup type="single" variant="segment" size="xs" spacing={1} value={item.mode} aria-label="Mode">
            {(['normal', 'yolo'] as const).map(mode => (
              // Radix keeps `value` for the toggle state; the button inside carries the field that the form sends
              <ToggleGroupItem key={mode} value={mode} asChild className={mode === 'yolo' ? 'data-[state=on]:bg-warning-subtle data-[state=on]:text-warning' : undefined}>
                <button type="submit" name="mode" value={mode} title={MODE_TITLE[mode]}>
                  {mode}
                </button>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Move>
      </ItemChips>
      {keys.length ? (
        <p className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-muted-foreground">
          {keys.map(([label, value]) => (
            <span key={label}>{label}<b className="ml-1.5 font-mono font-semibold text-foreground">{value}</b></span>
          ))}
        </p>
      ) : null}
    </header>
  )
}
