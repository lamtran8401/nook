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

// a wrapper runs the program that follows it; an assignment only sets the environment of that program
const WRAPPER = /(^|\/)(?:sudo|env|exec|command|nohup|time|xargs)$/
const ASSIGNMENT = /^[A-Za-z_]\w*=/

/** The program of each simple command: split on `;`, `|`, `&`, `(`, `)` and new lines outside quotes, past wrappers and assignments. */
export function commandNames(command: string): string[] {
  return simpleCommands(commandOnly(command)).flatMap(segment => {
    const words = segment.replace(/["'\\]/g, '').split(/\s+/).filter(Boolean)
    const name = words.find(word => !ASSIGNMENT.test(word) && !WRAPPER.test(word) && !word.startsWith('-'))
    return name ? [name] : []
  })
}

function simpleCommands(command: string): string[] {
  const segments: string[] = []
  let current = ''
  let quote: string | null = null
  for (let i = 0; i < command.length; i++) {
    const char = command[i]!
    if (quote) {
      if (char === quote) quote = null
      else if (char === '\\' && quote === '"') current += command[++i] ?? ''
      else current += char
      continue
    }
    if (char === '"' || char === "'") quote = char
    else if (char === '\\') current += command[++i] ?? ''
    else if (';|&()\n'.includes(char)) {
      segments.push(current)
      current = ''
    } else current += char
  }
  segments.push(current)
  return segments.map(s => s.trim()).filter(Boolean)
}
