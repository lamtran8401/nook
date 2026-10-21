import { cn } from '@nook/ui/lib/utils.ts'

type Step = 'done' | 'now' | 'todo'

const Bar = ({ step }: { step: Step }) => <i data-step={step} className="block h-[3px] flex-1 rounded-full bg-border data-[step=done]:bg-success data-[step=now]:bg-primary" />

/**
 * The steps of the flow as a thin bar: green before the current step, blue at it; a finished item is green all through.
 * With labels, each step names itself under its part, and the current one is in bold.
 */
export function StepBar({ count, at, finished = false, labels, className }: { count: number; at: number; finished?: boolean; labels?: string[]; className?: string }) {
  const stateOf = (i: number): Step => (finished || i < at ? 'done' : i === at ? 'now' : 'todo')
  if (!labels)
    return (
      <span data-slot="step-bar" aria-hidden="true" className={cn('flex gap-0.5', className)}>
        {Array.from({ length: count }, (_, i) => <Bar key={i} step={stateOf(i)} />)}
      </span>
    )
  return (
    <ol data-slot="step-bar" aria-label="Steps of the flow" className={cn('flex gap-1', className)}>
      {labels.map((label, i) => (
        <li key={label} {...(stateOf(i) === 'now' ? { 'aria-current': 'step' as const } : {})} className="flex min-w-0 flex-1 flex-col gap-1.5 text-[11.5px] text-muted-foreground aria-[current=step]:font-semibold aria-[current=step]:text-foreground">
          <span className="flex"><Bar step={stateOf(i)} /></span>
          <span className="truncate">{label}</span>
        </li>
      ))}
    </ol>
  )
}
