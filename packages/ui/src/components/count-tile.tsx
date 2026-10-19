import { Card } from '@nook/ui/components/card.tsx'

/** A count in large type over its label, with a bar of its tone on the left, such as the urgent waits of a desk. */
export function CountTile({ count, label, tone = 'neutral' }: { count: number; label: string; tone?: string }) {
  return (
    <Card data-tone={tone} className="gap-0.5 px-[18px] py-3.5 shadow-[var(--shadow-1),inset_3px_0_0_var(--t)]">
      <b className="text-[28px] leading-[34px] font-bold tracking-tight">{count}</b>
      <span className="text-[13px] text-muted-foreground">{label}</span>
    </Card>
  )
}
