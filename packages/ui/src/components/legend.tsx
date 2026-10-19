/** The meaning of each colour of a drawing: a swatch of the tone before its name. */
export function Legend({ items }: { items: [tone: string, label: string][] }) {
  return (
    <span data-slot="legend" className="flex flex-wrap justify-center gap-4 text-xs font-medium text-muted-foreground">
      {items.map(([tone, label]) => (
        <span key={label} data-tone={tone} className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2.5 rounded-[3px] bg-tone" />
          {label}
        </span>
      ))}
    </span>
  )
}
