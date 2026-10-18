/** The tone of the badge of each item state, as the Bench badges read it. */
export const STATE_TONE: Record<string, string> = {
  backlog: 'neutral',
  framing: 'primary',
  planning: 'primary',
  ready: 'primary',
  cooking: 'primary',
  review: 'warning',
  blocked: 'danger',
  done: 'success',
  cancelled: 'neutral',
}
