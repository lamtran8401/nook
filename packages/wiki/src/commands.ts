import { type Program, text } from '@nook/shared/cli.ts'
import { Exit, usage } from '@nook/shared/errors.ts'

import { requireWiki } from './module.ts'

/** The commands of the wiki pack: the index and the links. The skills read and write the pages. */
export const wikiProgram: Program = {
  name: 'nook wiki',
  summary: 'the wiki pack of Nook: the shelves, their indexes and the links',
  commands: [
    {
      path: ['index'],
      summary: 'check that each index has one line for each page; --fix adds the missing lines and indexes',
      usage: '[--fix]',
      flags: { fix: { type: 'boolean', help: 'add the missing lines and indexes; no line is removed' } },
      run(c) {
        const wiki = requireWiki()
        if (c.flags.fix) {
          const done = wiki.fix()
          c.out({ done }, d => (d.done.length ? d.done.join('\n') : 'nothing to add'))
        }
        const gaps = wiki.check()
        c.out(gaps, g => (g.length ? g.map(x => `✗ ${x.text}\n  fix: ${x.fix}`).join('\n') : '✓ each index has one line for each page'))
        return gaps.length ? Exit.error : Exit.ok
      },
    },
    {
      path: ['links'],
      summary: 'each [[link]] and Markdown link of the wiki that names no page',
      run(c) {
        const broken = requireWiki().brokenLinks()
        c.out(broken, b => (b.length ? b.map(x => `✗ ${x.page}: ${x.link}`).join('\n') : '✓ every link names a page'))
        return broken.length ? Exit.error : Exit.ok
      },
    },
    {
      path: ['retire'],
      summary: 'after a combined page: move the old pages to the archive, take their index rows out, point their links at it',
      usage: '<page...> --into <page> [--date YYYY-MM-DD]',
      flags: {
        into: { type: 'string', help: 'the combined page, such as resources/checkout.md; it must exist' },
        date: { type: 'string', help: 'the folder of the archive; today by default' },
      },
      run(c) {
        const into = text(c, 'into')
        if (!into || !c.args.length) throw usage('give the old pages and --into <the combined page>')
        const done = requireWiki().retire(c.args, into, text(c, 'date') ?? new Date().toISOString().slice(0, 10))
        c.out({ done }, d => d.done.join('\n'))
      },
    },
    {
      path: ['shelves'],
      summary: 'the shelves of the wiki and the use of each',
      run(c) {
        const wiki = requireWiki()
        c.out(wiki.config.shelves, s => s.map(x => `${x.name}/  ${x.use}${x.index ? '' : ' (no index)'}`).join('\n') || 'no shelf in nook.yml: /setup')
      },
    },
  ],
}
