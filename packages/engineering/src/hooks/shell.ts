/** The parts of a Bash command that the guard reads. */

/** The lines that the shell runs: heredoc bodies and comments are text, so they are dropped. */
export function shellText(command: string): string {
  const kept: string[] = []
  let end: string | null = null
  for (const line of command.split('\n')) {
    if (end !== null) {
      if (line.trim() === end) end = null
      continue
    }
    const here = /<<-?\s*['"]?([A-Za-z_][\w-]*)['"]?/.exec(line)
    kept.push(line.replace(/(^|\s)#.*$/, ''))
    if (here) end = here[1] ?? null
  }
  return kept.join('\n')
}

/** Quotes and backslashes go, blanks shrink: `kit "item" appr\ove` reads as `kit item approve`. */
export const normalize = (text: string) => text.replace(/[\\'"]/g, '').replace(/[ \t]+/g, ' ')

/** The simple commands of a line: split at `&&`, `||`, `;`, `|` and new lines. */
export const segments = (text: string) =>
  text
    .split(/&&|\|\||[;|\n]/)
    .map(s => s.trim())
    .filter(Boolean)

/** The words of a simple command, with the leading `NAME=value` assignments dropped. */
export function words(segment: string): string[] {
  const tokens = segment.split(/\s+/)
  while (tokens.length && /^[A-Za-z_]\w*=/.test(tokens[0]!)) tokens.shift()
  return tokens
}
