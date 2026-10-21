import { cn } from '@nook/ui/lib/utils.ts'

/** The steps of the flow as a thin bar: green before the current step, blue at it; a finished item is green all through. */
export function StepBar({ count, at, finished = false, className }: { count: number; at: number; finished?: boolean; className?: string }) {
  const stateOf = (i: number) => (finished || i < at ? 'done' : i === at ? 'now' : 'todo')
  return (
    <span data-slot="step-bar" aria-hidden="true" className={cn('flex gap-0.5', className)}>
      {Array.from({ length: count }, (_, i) => (
        <i key={i} data-step={stateOf(i)} className="h-[3px] flex-1 rounded-full bg-border data-[step=done]:bg-success data-[step=now]:bg-primary" />
      ))}
    </span>
  )
}
