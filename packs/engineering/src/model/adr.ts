import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { EvError, Exit, usage } from '@kit/shared/errors.ts'

import { frontMatter } from '../docs/spec.ts'
import { adrDir } from '../home.ts'
import type { Kit } from '../kit.ts'
import { assertCan } from '../role.ts'

/** Architecture decision records: `<home>/docs/adr/NNNN-title.md`, status in the front matter. */

export type Adr = { n: number; file: string; title: string; status: string; item: string | null; by: number | null }

const FILE = /^(\d{4})-(.+)\.md$/

export function adrs(kit: Kit): Adr[] {
  const dir = adrDir(kit.home)
  if (!existsSync(dir)) return []
  return readdirSync(dir).filter(f => FILE.test(f)).sort().map(f => {
    const text = readFileSync(join(dir, f), 'utf8')
    const front = frontMatter(text)
    const title = /^#\s+(?:ADR\s+\d+:\s*)?(.+)$/m.exec(text)?.[1] ?? FILE.exec(f)![2]!
    return { n: Number(FILE.exec(f)![1]), file: join(dir, f), title, status: String(front.status ?? 'proposed'), item: front.item ? String(front.item) : null, by: front.superseded_by ? Number(front.superseded_by) : null }
  })
}

export function newAdr(kit: Kit, title: string, item?: string): Adr {
  assertCan(kit.who, 'adr')
  if (!title.trim()) throw usage('give the title')
  const dir = adrDir(kit.home)
  mkdirSync(dir, { recursive: true })
  const n = Math.max(0, ...adrs(kit).map(a => a.n)) + 1
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50)
  const file = join(dir, `${String(n).padStart(4, '0')}-${slug}.md`)
  const date = new Date().toISOString().slice(0, 10)
  writeFileSync(file, `---\nstatus: proposed\ndate: ${date}\n${item ? `item: ${item}\n` : ''}---\n\n# ADR ${n}: ${title.trim()}\n\n## Context\n\n<!-- the facts that force a decision, with file and line -->\n\n## Decision\n\n<!-- the choice, in one or two sentences -->\n\n## Options not taken\n\n<!-- each option and why not -->\n\n## Consequences\n\n<!-- what gets easier, what gets harder -->\n`)
  return adrs(kit).find(a => a.n === n)!
}

export function setAdrStatus(kit: Kit, n: number, status: 'accepted' | 'superseded', by?: number): Adr {
  assertCan(kit.who, 'adr')
  const adr = adrs(kit).find(a => a.n === n)
  if (!adr) throw new EvError(`no ADR ${n}`, Exit.error, 'kit eng adr list')
  if (status === 'superseded' && (!by || !adrs(kit).some(a => a.n === by))) throw usage('--by must name an ADR that exists', 'kit eng adr list')
  const text = readFileSync(adr.file, 'utf8')
  const lines = text.split('\n')
  const end = lines.indexOf('---', 1)
  if (!lines[0]?.startsWith('---') || end < 0) throw new EvError(`${adr.file} has no front matter`, Exit.error, 'add --- status: proposed --- at the top')
  const front = lines.slice(1, end).filter(l => !/^(status|superseded_by):/.test(l))
  front.unshift(`status: ${status}`)
  if (by) front.push(`superseded_by: ${by}`)
  writeFileSync(adr.file, ['---', ...front, '---', ...lines.slice(end + 1)].join('\n'))
  return adrs(kit).find(a => a.n === n)!
}
