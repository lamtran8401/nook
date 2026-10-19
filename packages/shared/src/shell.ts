/** The words that the shell runs: heredoc bodies and comments are text, not commands. */
export function commandOnly(command: string): string {
  return splitHeredocs(command).code
}

/** The command lines with their comments gone, and the bodies of their heredocs; a `#` or `<<` inside quotes is text. */
function splitHeredocs(command: string): { code: string; bodies: string[] } {
  const kept: string[] = []
  const bodies: string[] = []
  let end: string | null = null
  for (const line of command.split('\n')) {
    if (end !== null) {
      if (line.trim() === end) end = null
      else bodies.push(line)
      continue
    }
    const { code, heredoc } = scanLine(line)
    kept.push(code)
    end = heredoc
  }
  return { code: kept.join('\n'), bodies }
}

function scanLine(line: string): { code: string; heredoc: string | null } {
  let quote: string | null = null
  let heredoc: string | null = null
  for (let i = 0; i < line.length; i++) {
    const char = line[i]!
    if (quote) {
      if (char === quote) quote = null
      else if (char === '\\' && quote === '"') i++
    } else if (char === '\\') i++
    else if (char === '"' || char === "'") quote = char
    else if (char === '#' && (i === 0 || /\s/.test(line[i - 1]!))) return { code: line.slice(0, Math.max(0, i - 1)), heredoc }
    else if (char === '<' && line[i + 1] === '<') {
      const here = /^<<-?\s*['"]?([A-Za-z_][\w-]*)['"]?/.exec(line.slice(i))
      if (here) heredoc = here[1]!
      i += here ? here[0].length - 1 : 1
    }
  }
  return { code: line, heredoc }
}

/** The command with its quotes and backslashes gone, so a spelling trick reads as the plain word. */
export const plainWords = (command: string): { plain: string; words: string[] } => {
  const plain = commandOnly(command).replace(/["'\\]/g, '')
  return { plain, words: plain.split(/[\s;|&<>()]+/).filter(Boolean) }
}

const SHELL = /(^|\/)(?:sh|bash|zsh|dash|ksh)$/
const SCRIPT_FLAG = /^-\w*c\w*$/

/** The code that a command runs itself: the words after `eval`, the script of `sh -c`, and whether a shell reads its input. */
function scriptsOf(words: string[]): { scripts: string[]; readsInput: boolean } {
  const scripts: string[] = []
  let readsInput = false
  words.forEach((word, i) => {
    if (/(^|\/)eval$/.test(word)) scripts.push(words.slice(i + 1).join(' '))
    if (!SHELL.test(word)) return
    let flag = i + 1
    while (words[flag]?.startsWith('-') && !SCRIPT_FLAG.test(words[flag]!)) flag++
    if (SCRIPT_FLAG.test(words[flag] ?? '')) scripts.push(words[flag + 1] ?? '')
    else readsInput = true
  })
  return { scripts, readsInput }
}

/** The code nested in a command line: its substitutions, its scripts, and its quoted words and heredoc bodies when a shell reads its input. */
function nestedCode(words: string[], parts: { quoted: string[]; code: string[] }, bodies: string[]): string[] {
  const { scripts, readsInput } = scriptsOf(words)
  return [...parts.code, ...scripts, ...(readsInput ? [...parts.quoted, ...bodies] : [])]
}

/**
 * The words of a command as the shell reads them: quotes join a word and go. The code that the command runs adds
 * its own words: a `$(...)` or backtick substitution, the words after `eval`, and the script of `sh -c`. A shell with
 * no `-c` runs its stdin or a file, so then each quoted word and each heredoc body of the command counts as code.
 */
export function shellWords(command: string): string[] {
  const { code: text, bodies } = splitHeredocs(command)
  const parts = splitWords(text)
  const words = parts.commands.flat()
  return [...words, ...nestedCode(words, parts, bodies).flatMap(shellWords)]
}

const ASSIGNMENT = /^[A-Za-z_]\w*=/

/**
 * The simple commands of a line, each as its words with the leading `NAME=value` assignments dropped. The commands
 * of its nested code, read as `shellWords` reads it, follow the commands of the line.
 */
export function shellCommands(command: string): string[][] {
  const { code: text, bodies } = splitHeredocs(command)
  const parts = splitWords(text)
  const own = parts.commands.map(words => words.slice(Math.max(0, words.findIndex(word => !ASSIGNMENT.test(word))))).filter(words => words.length)
  return [...own, ...nestedCode(parts.commands.flat(), parts, bodies).flatMap(shellCommands)]
}

/** One pass over the text: its simple commands, the words that held a quote, and the code of each substitution outside single quotes. */
function splitWords(text: string): { commands: string[][]; quoted: string[]; code: string[] } {
  const commands: string[][] = []
  const quoted: string[] = []
  const code: string[] = []
  let current: string[] = []
  let word = ''
  let quote: string | null = null
  let held = false
  const endWord = () => {
    if (word) current.push(word)
    if (word && held) quoted.push(word)
    word = ''
    held = false
  }
  const endCommand = () => {
    endWord()
    if (current.length) commands.push(current)
    current = []
  }
  for (let i = 0; i < text.length; i++) {
    const char = text[i]!
    if (quote === "'") {
      if (char === "'") quote = null
      else word += char
    } else if (char === '\\') word += text[++i] ?? ''
    else if (char === '`' || (char === '$' && text[i + 1] === '(')) {
      const close = char === '`' ? text.indexOf('`', i + 1) : closingParen(text, i + 1)
      const stop = close === -1 ? text.length : close
      code.push(text.slice(char === '`' ? i + 1 : i + 2, stop))
      i = stop
    } else if (quote === '"') {
      if (char === '"') quote = null
      else word += char
    } else if (char === '"' || char === "'") {
      quote = char
      held = true
    } else if (/[\n;|&()]/.test(char)) endCommand()
    else if (/[\s<>{}!]/.test(char)) endWord()
    else word += char
  }
  endCommand()
  return { commands, quoted, code }
}

function closingParen(text: string, open: number): number {
  let depth = 0
  for (let i = open; i < text.length; i++) {
    if (text[i] === '(') depth++
    else if (text[i] === ')' && --depth === 0) return i
  }
  return -1
}
