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

/** One word of a command as the shell reads it, and whether any part of it was quoted. */
export type Word = { text: string; quoted: boolean }

/**
 * The simple commands of a command line as the shell splits them: quotes join a string into one word,
 * a backslash escapes the next character, and `&&`, `||`, `;`, `|`, `&`, new lines and parentheses end a command.
 */
export function commands(command: string): Word[][] {
  const out: Word[][] = []
  let current: Word[] = []
  let text = ''
  let quoted = false
  let inWord = false
  let quote: '"' | "'" | null = null
  const endWord = () => {
    if (inWord) current.push({ text, quoted })
    text = ''
    quoted = false
    inWord = false
  }
  const endCommand = () => {
    endWord()
    if (current.length) out.push(current)
    current = []
  }
  for (let i = 0; i < command.length; i++) {
    const c = command[i]!
    if (quote) {
      if (c === quote) quote = null
      else if (c === '\\' && quote === '"' && i + 1 < command.length) text += command[++i]
      else text += c
      continue
    }
    if (c === '"' || c === "'") {
      quote = c
      quoted = true
      inWord = true
    } else if (c === '\\' && i + 1 < command.length) {
      text += command[++i]
      inWord = true
    } else if (c === ' ' || c === '\t') endWord()
    else if (c === '\n' || c === ';' || c === '|' || c === '&' || c === '(' || c === ')') endCommand()
    else {
      text += c
      inWord = true
    }
  }
  endCommand()
  return out
}

/** A call of the tool in a command line: where its prefix (`kit eng `) ends, and where its command ends. */
export type CallSpan = { prefixEnd: number; end: number }

const CALL_PREFIX = /^(?:kit eng|kit engineering)[ \t]/
const LEAD_WORD = /^(?:[A-Za-z_]\w*=\S*|then|do|else|if|while|until|!)[ \t]+/
const OPERATORS = new Set([';', '&', '|', '(', ')'])

/**
 * Each call of the tool that the shell runs, found by its position as a command word.
 * Text in quotes, comments and heredoc bodies is skipped, so a file that mentions the tool is never changed.
 */
export function callSpans(command: string): CallSpan[] {
  const spans: CallSpan[] = []
  let open: { prefixEnd: number } | null = null
  const close = (at: number) => {
    if (open) spans.push({ prefixEnd: open.prefixEnd, end: at })
    open = null
  }
  let offset = 0
  let heredoc: string | null = null
  for (const line of command.split('\n')) {
    const lineEnd = offset + line.length
    if (heredoc !== null) {
      if (line.trim() === heredoc) heredoc = null
      offset = lineEnd + 1
      continue
    }
    let quote: string | null = null
    let atStart = true
    for (let j = 0; j < line.length; j++) {
      const c = line[j]!
      if (quote) {
        if (c === '\\' && quote === '"') j++
        else if (c === quote) quote = null
        continue
      }
      if (atStart) {
        if (c === ' ' || c === '\t') continue
        const lead = LEAD_WORD.exec(line.slice(j))
        if (lead) {
          j += lead[0].length - 1
          continue
        }
        const call = CALL_PREFIX.exec(line.slice(j))
        if (call) open = { prefixEnd: offset + j + call[0].length }
        atStart = false
      }
      if (c === '"' || c === "'") quote = c
      else if (c === '\\') j++
      else if (c === '#' && (j === 0 || /\s/.test(line[j - 1]!))) break
      else if (OPERATORS.has(c)) {
        close(offset + j)
        atStart = true
      }
    }
    close(lineEnd)
    const here = /<<-?\s*['"]?([A-Za-z_][\w-]*)['"]?/.exec(line)
    if (here && !quote) heredoc = here[1]!
    offset = lineEnd + 1
  }
  return spans
}

/** The words of a simple command after the leading `NAME=value` assignments. */
export function commandWords(words: Word[]): Word[] {
  let i = 0
  while (i < words.length && !words[i]!.quoted && /^[A-Za-z_]\w*=/.test(words[i]!.text)) i++
  return words.slice(i)
}
