import { type Command, type Program, run } from '@nook/shared/cli.ts'

import { coreProgram } from '@nook/core/commands.ts'
import { engineeringProgram, takeRoleFlags } from '@nook/engineering/commands.ts'
import { engineeringModule } from '@nook/engineering/module.ts'
import { issuesProgram } from '@nook/issues/commands.ts'
import { issuesModule } from '@nook/issues/module.ts'
import { learnProgram } from '@nook/learn/commands.ts'
import { learnModule } from '@nook/learn/module.ts'
import { wikiProgram } from '@nook/wiki/commands.ts'
import { wikiModule } from '@nook/wiki/module.ts'

/** The commands of a pack sit under its word: `nook eng item show SHOP-12`. */
const under = (word: string, commands: Command[]): Command[] => commands.map(c => ({ ...c, path: [word, ...c.path] }))

const core = coreProgram([engineeringModule, issuesModule, wikiModule, learnModule])
const program: Program = {
  name: 'nook',
  summary: core.summary,
  commands: [...core.commands, ...under('eng', engineeringProgram.commands), ...under('issues', issuesProgram.commands), ...under('wiki', wikiProgram.commands), ...under('learn', learnProgram.commands)],
}

// `nook engineering …` is the long spelling of `nook eng …`
const argv = takeRoleFlags(process.argv.slice(2))
if (argv[0] === 'engineering') argv[0] = 'eng'
process.exit(await run(program, argv))
