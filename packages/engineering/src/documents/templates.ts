import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { pluginDir } from '@kit/env/pack.ts'

import type { ItemDoc, WorkFolder } from './work-folder.ts'

/** The templates of the documents in `plugins/engineering/templates/`. */

export type TemplateItem = { id: string; title: string; kind: string; size: string; areas: string[] }

const INVESTIGATE_QUESTIONS =
  '## Questions\n\n<!-- one `- question` line each; findings.md answers them with evidence -->\n'

export class Templates {
  /** The plugin folder is looked up on the first scaffold only. */
  constructor(private dir?: string) {}

  /** Writes a document from its template when it does not exist yet; returns the note for the caller. */
  scaffold(folder: WorkFolder, item: TemplateItem, doc: ItemDoc): string[] {
    const file = folder.path(doc)
    if (existsSync(file)) return []
    mkdirSync(folder.dir, { recursive: true })
    this.dir ??= join(pluginDir('engineering'), 'templates')
    writeFileSync(file, fill(readFileSync(join(this.dir, doc), 'utf8'), item))
    return [`wrote ${file}`]
  }
}

export function fill(template: string, item: TemplateItem): string {
  const text = template
    .replaceAll('{{id}}', item.id)
    .replaceAll('{{title}}', item.title)
    .replaceAll('{{kind}}', item.kind)
    .replaceAll('{{size}}', item.size)
    .replaceAll('{{areas}}', `[${item.areas.join(', ')}]`)
  if (item.kind !== 'investigate') return text
  // an investigation asks questions in place of criteria
  return text.replace(/## Acceptance criteria\n[\s\S]*?(?=\n## |$)/, INVESTIGATE_QUESTIONS)
}
