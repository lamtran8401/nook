import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

/** One Markdown file that holds a title and one table: the record of a course that a person and an agent both read. */
export class MdTable {
  constructor(
    readonly file: string,
    readonly title: string,
    readonly columns: string[],
  ) {}

  /** The rows of the table; a file that does not exist holds none. */
  rows(): string[][] {
    if (!existsSync(this.file)) return []
    return readFileSync(this.file, 'utf8')
      .split('\n')
      .filter(line => line.startsWith('|') && !/^\|[\s|:-]*\|$/.test(line))
      .slice(1)
      .map(cellsOf)
  }

  write(rows: string[][]): void {
    mkdirSync(dirname(this.file), { recursive: true })
    const lines = [`# ${this.title}`, '', rowOf(this.columns), `|${this.columns.map(() => '---').join('|')}|`, ...rows.map(rowOf)]
    writeFileSync(this.file, `${lines.join('\n')}\n`)
  }

  append(row: string[]): void {
    this.write([...this.rows(), row])
  }
}

const rowOf = (cells: string[]) => `|${cells.map(cell => (cell ? ` ${cell.replace(/\|/g, '\\|')} ` : ' ')).join('|')}|`

/** The cells of one row; a bar after a backslash is part of the text. */
function cellsOf(line: string): string[] {
  return line
    .slice(1, line.endsWith('|') ? -1 : undefined)
    .split(/(?<!\\)\|/)
    .map(cell => cell.trim().replace(/\\\|/g, '|'))
}
