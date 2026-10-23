import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { pluginDir } from '@nook/desk/desks.ts'

import { flowOf } from '../flows.ts'
import { now } from '../ledger.ts'
import type { ItemKind } from '../vocabulary.ts'
import type { ItemDoc, WorkFolder } from './work-folder.ts'

/** The templates of the documents in `plugins/engineering/templates/`. */

export type TemplateItem = { id: string; title: string; kind: ItemKind; size: string; areas: string[] }

const INVESTIGATE_QUESTIONS =
  '## Questions\n\n<!-- One `- question` line each. findings.md answers each one with evidence. -->\n'

/** The date of today as `YYYY-MM-DD`, from the clock of the ledger. */
export const today = () => now().slice(0, 10)

export class Templates {
  /** The plugin folder is looked up on the first scaffold only. */
  constructor(
    private dir?: string,
    private readonly date: () => string = today,
  ) {}

  /** Writes a document from its template when it does not exist yet; returns the note for the caller. */
  scaffold(folder: WorkFolder, item: TemplateItem, doc: ItemDoc): string[] {
    const file = folder.path(doc)
    if (existsSync(file)) return []
    mkdirSync(folder.dir, { recursive: true })
    this.dir ??= join(pluginDir(), 'templates')
    writeFileSync(file, fill(readFileSync(join(this.dir, doc), 'utf8'), item, this.date()))
    return [`wrote ${file}`]
  }
}

export function fill(template: string, item: TemplateItem, date: string): string {
  let text = template
    .replaceAll('{{id}}', item.id)
    .replaceAll('{{title}}', item.title)
    .replaceAll('{{kind}}', item.kind)
    .replaceAll('{{size}}', item.size)
    .replaceAll('{{areas}}', `[${item.areas.join(', ')}]`)
    .replaceAll('{{today}}', date)
  // only a plan of size L needs the Flow
  if (item.size !== 'L') text = text.replace(/\n## Flow\n[\s\S]*?(?=\n## |$)/, '')
  const flow = flowOf(item.kind)
  const sections = flow.spec.sections.map(section => `## ${section}\n\n<!-- From the ticket. -->\n\n`).join('')
  if (sections) text = text.replace('## Acceptance criteria', `${sections}## Acceptance criteria`)
  if (flow.spec.questions !== 'required') return text
  // a flow that asks questions has them in place of the criteria
  return text.replace(/## Acceptance criteria\n[\s\S]*?(?=\n## |$)/, INVESTIGATE_QUESTIONS)
}
