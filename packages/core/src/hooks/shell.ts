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

const SHELL = /(^|\/)(?:sh|bash|zsh|dash|ksh)$/

/**
 * The words of a command as the shell reads them: quotes join a word and go. The code that the command runs adds
 * its own words: a `$(...)` or backtick substitution, the words after `eval`, and the script of `sh -c`.
 */
export function shellWords(command: string): string[] {
  const { words, code } = splitWords(commandOnly(command))
  const nested = [...code]
  words.forEach((word, i) => {
    if (SHELL.test(word) && /^-\w*c\w*$/.test(words[i + 1] ?? '')) nested.push(words[i + 2] ?? '')
    if (/(^|\/)eval$/.test(word)) nested.push(words.slice(i + 1).join(' '))
  })
  return [...words, ...nested.flatMap(shellWords)]
}

/** One pass over the text: its words, and the code of each substitution outside single quotes. */
function splitWords(text: string): { words: string[]; code: string[] } {
  const words: string[] = []
  const code: string[] = []
  let word = ''
  let quote: string | null = null
  const endWord = () => {
    if (word) words.push(word)
    word = ''
  }
  for (let i = 0; i < text.length; i++) {
    const char = text[i]!
    if (quote !== "'" && (char === '`' || (char === '$' && text[i + 1] === '('))) {
      const close = char === '`' ? text.indexOf('`', i + 1) : closingParen(text, i + 1)
      const stop = close === -1 ? text.length : close
      code.push(text.slice(char === '`' ? i + 1 : i + 2, stop))
      i = stop
    } else if (quote) {
      if (char === quote) quote = null
      else if (char === '\\' && quote === '"') word += text[++i] ?? ''
      else word += char
    } else if (char === '"' || char === "'") quote = char
    else if (char === '\\') word += text[++i] ?? ''
    else if (/[\s;|&()<>{}!]/.test(char)) endWord()
    else word += char
  }
  endWord()
  return { words, code }
}

function closingParen(text: string, open: number): number {
  let depth = 0
  for (let i = open; i < text.length; i++) {
    if (text[i] === '(') depth++
    else if (text[i] === ')' && --depth === 0) return i
  }
  return -1
}
