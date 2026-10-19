import { Check } from 'lucide-react'

export type Step = { key: string; label: string; state: 'done' | 'current' | 'upcoming'; desc?: string | undefined }

/** The steps of a flow, each done, current or upcoming, joined by a line that is solid up to the current one. */
export function Stepper({ steps }: { steps: Step[] }) {
  return (
    <ol data-slot="stepper" className="grid auto-cols-fr grid-flow-col">
      {steps.map((step, i) => (
        <li key={step.key} data-state={step.state} className="group/step relative grid content-start justify-items-center gap-1 text-center">
          {i ? <span aria-hidden="true" className="absolute top-[13px] right-1/2 left-[-50%] z-0 h-0.5 bg-border group-data-[state=done]/step:bg-success group-data-[state=current]/step:bg-success" /> : null}
          <span className="relative z-10 grid size-7 place-items-center rounded-full bg-muted text-xs font-semibold text-muted-foreground group-data-[state=current]/step:bg-surface group-data-[state=current]/step:text-primary group-data-[state=current]/step:ring-2 group-data-[state=current]/step:ring-primary group-data-[state=done]/step:bg-success group-data-[state=done]/step:text-surface">
            {step.state === 'done' ? <Check className="size-3.5" strokeWidth={3} aria-hidden="true" /> : i + 1}
          </span>
          <span className="text-sm text-muted-foreground group-data-[state=current]/step:font-semibold group-data-[state=current]/step:text-foreground group-data-[state=done]/step:font-semibold group-data-[state=done]/step:text-foreground">{step.label}</span>
          {step.desc ? <span className="font-mono text-[11px] text-muted-foreground">{step.desc}</span> : null}
        </li>
      ))}
    </ol>
  )
}
