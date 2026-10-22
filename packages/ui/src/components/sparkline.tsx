/** A thin trend line of a few points, such as one for each of the last six weeks; a point with no data leaves a gap in the line. */
export function Sparkline({ points, tone = 'primary', label }: { points: (number | null)[]; tone?: string; label: string }) {
  const known = points.filter((p): p is number => p !== null)
  const low = Math.min(...known)
  const span = Math.max(...known) - low || 1
  const x = (i: number) => (points.length > 1 ? (i / (points.length - 1)) * 100 : 50)
  // a flat line sits in the middle; the top and the bottom keep 3 units so the stroke is never cut
  const y = (p: number) => (known.length && Math.max(...known) !== low ? 27 - ((p - low) / span) * 24 : 15)
  const runs: string[] = []
  let run: string[] = []
  points.forEach((p, i) => {
    if (p === null) {
      if (run.length) runs.push(run.join(' '))
      run = []
      return
    }
    run.push(`${x(i).toFixed(1)},${y(p).toFixed(1)}`)
  })
  if (run.length) runs.push(run.join(' '))
  return (
    <svg data-slot="sparkline" data-tone={tone} role="img" aria-label={label} viewBox="0 0 100 30" preserveAspectRatio="none" className="h-7 w-full text-tone">
      {runs.map(points => (
        <polyline key={points} points={points} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  )
}
