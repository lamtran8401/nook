export type Segment = { key: string; tone: string; size?: number; label?: string }

/** A bar of parts in their tones, each as wide as its size, such as the slices by state or the time in each step; a part can name itself under it. */
export function SegmentBar({ parts, label }: { parts: Segment[]; label: string }) {
  return (
    <ol data-slot="segment-bar" aria-label={label} className="flex gap-0.5">
      {parts.map(part => (
        <li key={part.key} title={part.label ?? part.key} style={{ flex: Math.max(part.size ?? 1, 0.02) }} className="flex min-w-0 flex-col items-center gap-1">
          <i data-tone={part.tone} className="block h-2 w-full rounded-full bg-tone" aria-hidden="true" />
          {part.label ? <span className="truncate font-mono text-[10.5px] text-muted-foreground">{part.label}</span> : null}
        </li>
      ))}
    </ol>
  )
}
