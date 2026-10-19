import { KIND_TONE, STATE_TONE } from './tones.ts'

/** The small marks of an item that every page shares: its state, its kind and whose turn it is. */

// how far along the flow each state is: the share of the ring that its icon fills
const FILL: Record<string, number> = { framing: 0.25, planning: 0.4, ready: 0.55, cooking: 0.7, review: 0.85, blocked: 0.7 }
const RING = 2 * Math.PI * 2.5

export function StateIcon({ state, size = 14 }: { state: string; size?: number }) {
  const tone = STATE_TONE[state] ?? 'neutral'
  const body =
    state === 'done' ? (
      <>
        <circle cx="7" cy="7" r="6" fill="currentColor" />
        <path d="M4.2 7.2l1.9 1.9 3.7-4" fill="none" stroke="var(--surface)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ) : FILL[state] === undefined ? (
      <circle cx="7" cy="7" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
    ) : (
      <>
        <circle cx="7" cy="7" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="7" cy="7" r="2.5" fill="none" stroke="currentColor" strokeWidth="5" strokeDasharray={`${(RING * FILL[state]).toFixed(2)} ${(RING * 2).toFixed(2)}`} transform="rotate(-90 7 7)" />
      </>
    )
  return (
    <svg className="nk-stateicon" data-tone={tone} data-state={state} viewBox="0 0 14 14" width={size} height={size} aria-hidden="true">
      {body}
    </svg>
  )
}

/** The state as a tag: its icon and its name, in its tone. */
export function StateTag({ state }: { state: string }) {
  return (
    <span className="nk-state" data-tone={STATE_TONE[state] ?? 'neutral'}>
      <StateIcon state={state} size={12} />
      {state}
    </span>
  )
}

// one white glyph on a 24 grid for each kind
const KIND_GLYPH: Record<string, string> = {
  feature: 'M7 4h10v16l-5-3.5L7 20z',
  fix: 'M12 7a4 4 0 0 1 4 4v3a4 4 0 0 1-8 0v-3a4 4 0 0 1 4-4zM12 7V4M8 12H4M20 12h-4',
  chore: 'M5 12l5 5 9-10',
  investigate: 'M11 5a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM20 20l-4.5-4.5',
}

export function KindIcon({ kind }: { kind: string }) {
  return (
    <span className="nk-kind" data-tone={KIND_TONE[kind] ?? 'neutral'} title={kind} role="img" aria-label={kind}>
      <svg viewBox="0 0 24 24" width="11" height="11" aria-hidden="true">
        <path d={KIND_GLYPH[kind] ?? KIND_GLYPH.chore} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

/** Whose move comes next: YOU for the owner, AI for the lead; the title names the move. */
export function Turn({ owner, title }: { owner: boolean; title: string }) {
  return (
    <span className="nk-turn" data-tone={owner ? 'primary' : 'violet'} title={title}>
      {owner ? 'YOU' : 'AI'}
    </span>
  )
}
