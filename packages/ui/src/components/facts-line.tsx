export type Fact = { label: string; tone: string }

/** A short line of facts, each with the dot of its tone, such as `3 of 4 criteria met`: the evidence beside a decision. */
export function FactsLine({ facts }: { facts: Fact[] }) {
  return (
    <p data-slot="facts-line" className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-muted-foreground">
      {facts.map(fact => (
        <span key={fact.label} className="inline-flex items-center gap-1.5">
          <i data-tone={fact.tone} className="size-1.5 rounded-full bg-tone" aria-hidden="true" />
          {fact.label}
        </span>
      ))}
    </p>
  )
}
