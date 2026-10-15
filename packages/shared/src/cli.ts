import { parseArgs } from 'node:util'

import { EvError, Exit, usage } from './errors.ts'

/** A flag of a command. `list` collects every value of a repeated flag. */
export type Flag = { type: 'string' | 'boolean'; short?: string; list?: boolean; help?: string }

export type Context = {
  args: string[]
  flags: Record<string, string | boolean | string[] | undefined>
  json: boolean
  /** Print a result: JSON with `--json`, else the text that `text` makes from it. */
  out<T>(value: T, text?: (value: T) => string): void
  /** Print a line on stderr (never mixed into `--json` output). */
  say(line: string): void
}

export type Command = {
  path: string[]
  summary: string
  usage?: string
  flags?: Record<string, Flag>
  run(context: Context): Promise<number | undefined> | number | undefined
}

export type Program = { name: string; summary: string; commands: Command[] }

const GLOBAL_FLAGS: Record<string, Flag> = {
  json: { type: 'boolean', help: 'print JSON' },
  help: { type: 'boolean', short: 'h', help: 'show the usage' },
}

export async function run(program: Program, argv: string[]): Promise<number> {
  const command = find(program.commands, argv)
  if (!command) {
    const words = argv.filter(word => !word.startsWith('-') && word !== 'help')
    // `kit eng` alone names a group: its help, not an error
    const known = words.length === 0 || program.commands.some(c => words.every((word, i) => c.path[i] === word))
    if (!known) process.stderr.write(`${program.name}: unknown command "${words.join(' ')}"\n\n`)
    process.stdout.write(help(program, argv))
    return known ? Exit.ok : Exit.usage
  }
  const rest = argv.slice(command.path.length)
  try {
    const context = parse(command, rest)
    if (context.flags.help) {
      process.stdout.write(`${line(program, command)}\n${flagHelp(command)}`)
      return Exit.ok
    }
    return (await command.run(context)) ?? Exit.ok
  } catch (error) {
    return report(program, command, error)
  }
}

function find(commands: Command[], argv: string[]): Command | undefined {
  return commands
    .filter(command => command.path.every((word, i) => argv[i] === word))
    .sort((a, b) => b.path.length - a.path.length)[0]
}

function parse(command: Command, rest: string[]): Context {
  const options = Object.fromEntries(
    Object.entries({ ...GLOBAL_FLAGS, ...command.flags }).map(([name, flag]) => [
      name,
      { type: flag.type, ...(flag.short ? { short: flag.short } : {}), ...(flag.list ? { multiple: true } : {}) },
    ]),
  )
  let parsed: ReturnType<typeof parseArgs>
  try {
    parsed = parseArgs({ args: spreadLists(rest, command.flags ?? {}), options, allowPositionals: true, strict: true })
  } catch (error) {
    throw usage((error as Error).message.replace(/^.*?: /, ''), `run with --help to see the flags`)
  }
  const json = parsed.values.json === true
  return {
    args: parsed.positionals,
    flags: parsed.values as Context['flags'],
    json,
    out(value, text) {
      if (json) process.stdout.write(`${JSON.stringify(value, null, 2)}\n`)
      else process.stdout.write(`${text ? text(value) : String(value)}\n`.replace(/\n+$/, '\n'))
    },
    say(message) {
      process.stderr.write(`${message}\n`)
    },
  }
}

/** `--files a b c` as `--files a --files b --files c`: a list flag takes each word up to the next flag. */
function spreadLists(rest: string[], flags: Record<string, Flag>): string[] {
  const out: string[] = []
  let list: string | null = null
  for (const [i, word] of rest.entries()) {
    if (word === '--') return [...out, ...rest.slice(i)]
    if (word.startsWith('-')) {
      const name = /^--([\w-]+)$/.exec(word)?.[1]
      list = name && flags[name]?.list ? word : null
      out.push(word)
      continue
    }
    // the first word after the flag is its own value; the next ones repeat the flag
    if (list && out.at(-1) !== list) out.push(list)
    out.push(word)
  }
  return out
}

function report(program: Program, command: Command, error: unknown): number {
  if (error instanceof EvError) {
    process.stderr.write(`${program.name} ${command.path.join(' ')}: ${error.message}\n`)
    if (error.fix && !error.message.includes(error.fix)) process.stderr.write(`fix: ${error.fix}\n`)
    if (error.code === Exit.usage) process.stderr.write(`usage: ${line(program, command)}\n`)
    return error.code
  }
  process.stderr.write(`${program.name} ${command.path.join(' ')}: ${(error as Error)?.stack ?? String(error)}\n`)
  return Exit.error
}

const line = (program: Program, command: Command) =>
  `${program.name} ${command.path.join(' ')}${command.usage ? ` ${command.usage}` : ''}`

function flagHelp(command: Command): string {
  const flags = Object.entries({ ...command.flags, ...GLOBAL_FLAGS })
  return `${command.summary}\n${flags
    .map(([name, flag]) => `  --${name}${flag.type === 'string' ? ' <value>' : ''}${flag.help ? `  ${flag.help}` : ''}`)
    .join('\n')}\n`
}

function help(program: Program, argv: string[]): string {
  const prefix = argv.filter(word => !word.startsWith('-') && word !== 'help')
  const shown = program.commands.filter(command => prefix.every((word, i) => command.path[i] === word))
  const list = shown.length ? shown : program.commands
  const width = Math.max(...list.map(command => line(program, command).length))
  return `${program.name}: ${program.summary}\n\n${list
    .map(command => `  ${line(program, command).padEnd(width)}  ${command.summary}`)
    .join('\n')}\n`
}

export function text(context: Context, name: string): string | undefined {
  const value = context.flags[name]
  return typeof value === 'string' ? value : undefined
}

/** A repeated flag; one value can also join names with commas. */
export function list(context: Context, name: string): string[] {
  const value = context.flags[name]
  const values = Array.isArray(value) ? value : typeof value === 'string' ? [value] : []
  return values.flatMap(entry => entry.split(',')).map(entry => entry.trim()).filter(Boolean)
}

export function arg(context: Context, index: number, name: string): string {
  const value = context.args[index]
  if (!value) throw usage(`give the ${name}`)
  return value
}
