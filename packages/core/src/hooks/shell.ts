/** The words that the shell runs: heredoc bodies and comments are text, not commands. */
export function commandOnly(command: string): string {
  const kept: string[] = []
  let end: string | null = null
  for (const line of command.split('\n')) {
    if (end !== null) {
      if (line.trim() === end) end = null
      continue
    }
    const here = line.match(/<<-?\s*['"]?([A-Za-z_][\w-]*)['"]?/)
    kept.push(line.replace(/(^|\s)#.*$/, ''))
    if (here) end = here[1] ?? null
  }
  return kept.join('\n')
}

/** The command with its quotes and backslashes gone, so a spelling trick reads as the plain word. */
export const plainWords = (command: string): { plain: string; words: string[] } => {
  const plain = commandOnly(command).replace(/["'\\]/g, '')
  return { plain, words: plain.split(/[\s;|&<>()]+/).filter(Boolean) }
}
