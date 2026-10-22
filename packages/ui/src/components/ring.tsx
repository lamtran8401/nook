const RING = 2 * Math.PI * 2.5

/** A small ring that fills its share of the circle: 0 is a dashed ring, 1 a disc with a check, as a state along a flow. */
export function RingIcon({ fill, tone = 'neutral', size = 14 }: { fill: number; tone?: string; size?: number }) {
  const body =
    fill >= 1 ? (
      <>
        <circle cx="7" cy="7" r="6" fill="currentColor" />
        <path d="M4.2 7.2l1.9 1.9 3.7-4" fill="none" stroke="var(--surface)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ) : fill <= 0 ? (
      <circle cx="7" cy="7" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
    ) : (
      <>
        <circle cx="7" cy="7" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="7" cy="7" r="2.5" fill="none" stroke="currentColor" strokeWidth="5" strokeDasharray={`${(RING * fill).toFixed(2)} ${(RING * 2).toFixed(2)}`} transform="rotate(-90 7 7)" />
      </>
    )
  return (
    <svg data-slot="ring-icon" data-tone={tone} viewBox="0 0 14 14" width={size} height={size} aria-hidden="true" className="shrink-0 text-tone">
      {body}
    </svg>
  )
}

/** A ring with its share in the middle, such as the criteria met; `label` puts other words there, such as `1/5`. */
export function PercentRing({ value, tone = 'primary', size = 48, label }: { value: number; tone?: string; size?: number; label?: string }) {
  const round = Math.round(value)
  const r = 20
  const length = 2 * Math.PI * r
  return (
    <span data-slot="percent-ring" data-tone={tone} role="img" aria-label={label ?? `${round}%`} className="relative inline-grid shrink-0 place-items-center text-tone" style={{ width: size, height: size }}>
      <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" className="absolute inset-0 -rotate-90">
        <circle cx="24" cy="24" r={r} fill="none" stroke="var(--bg-muted)" strokeWidth="5" />
        {round > 0 ? <circle cx="24" cy="24" r={r} fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${((length * round) / 100).toFixed(2)} ${length.toFixed(2)}`} /> : null}
      </svg>
      <span className="relative font-mono font-medium text-foreground" style={{ fontSize: Math.max(11, size / 4) }}>{label ?? `${round}%`}</span>
    </span>
  )
}
