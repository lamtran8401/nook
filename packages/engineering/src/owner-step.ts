/** An owner move as the owner types it in the prompt: `/gate` and its words, never a command for a terminal. */
export const OWNER_STEP = 'owner: /gate '

export const ownerStep = (words: string) => `${OWNER_STEP}${words}`
