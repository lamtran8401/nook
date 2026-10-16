/** The `INDEX.md` of a shelf: a table with one row for each page, `| Page | Type | Summary |`. */

export type IndexLine = { page: string; type: string; summary: string }

const ROW = /^\s*\|/
const SEPARATOR = /^\s*\|[\s:|-]+\|?\s*$/
const LINK = /^\[[^\]]*\]\(([^)]+)\)$/

const cells = (row: string) =>
  row
    .trim()
    .replace(/^\||\|$/g, '')
    .split(/(?<!\\)\|/)
    .map(cell => cell.trim())

/** The lines of the first table of the file; the first row is its header. */
export function parseIndex(text: string): IndexLine[] {
  const rows = tableRows(text.split('\n')).map(i => text.split('\n')[i]!)
  return rows
    .slice(1)
    .filter(row => !SEPARATOR.test(row))
    .map(row => {
      const [page = '', type = '', summary = ''] = cells(row)
      return { page: LINK.exec(page)?.[1] ?? page, type, summary: summary.replace(/\\\|/g, '|') }
    })
    .filter(line => line.page)
}

/** The numbers of the lines of the first table. */
function tableRows(lines: string[]): number[] {
  const start = lines.findIndex(line => ROW.test(line))
  if (start < 0) return []
  const rows: number[] = []
  for (let i = start; i < lines.length && ROW.test(lines[i]!); i++) rows.push(i)
  return rows
}

export const indexRow = (line: IndexLine) => `| [${line.page}](${line.page}) | ${line.type} | ${line.summary.replace(/\|/g, '\\|')} |`

/** The text with the rows put after the last row of its first table; every other line stays as it is. */
export function addRows(text: string, rows: string[], header: string): string {
  const lines = text.replace(/\n$/, '').split('\n')
  const table = tableRows(lines)
  if (!table.length) return `${[...lines, '', header, ...rows].join('\n')}\n`
  const last = table.at(-1)!
  return `${[...lines.slice(0, last + 1), ...rows, ...lines.slice(last + 1)].join('\n')}\n`
}
