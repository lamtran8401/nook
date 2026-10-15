/** The kit block of CLAUDE.md: the only part of the file that the kit writes. */
export const BLOCK_BEGIN = '<!-- kit:begin -->'
export const BLOCK_END = '<!-- kit:end -->'

export const hasBlock = (text: string): boolean => text.includes(BLOCK_BEGIN) && text.includes(BLOCK_END)

/** Puts the block at the end of the file, or replaces the block that is there when `update` is on. */
export function placeBlock(text: string, block: string, update: boolean): string {
  const begin = text.indexOf(BLOCK_BEGIN)
  const end = text.indexOf(BLOCK_END)
  if (begin >= 0 && end > begin) {
    if (!update) return text
    return text.slice(0, begin) + block + text.slice(end + BLOCK_END.length)
  }
  const head = text.trimEnd()
  return head ? `${head}\n\n${block}\n` : `${block}\n`
}
