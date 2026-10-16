import { type Command, type Program, run } from '@kit/shared/cli.ts'

import { coreProgram } from '@kit/core/commands.ts'
import { engineeringProgram, takeRoleFlags } from '@kit/engineering/commands.ts'
import { engineeringModule } from '@kit/engineering/module.ts'
import { learnProgram } from '@kit/learn/commands.ts'
import { learnModule } from '@kit/learn/module.ts'
import { wikiProgram } from '@kit/wiki/commands.ts'
import { wikiModule } from '@kit/wiki/module.ts'

/** The commands of a pack sit under its word: `kit eng item show SHOP-12`. */
const under = (word: string, commands: Command[]): Command[] => commands.map(c => ({ ...c, path: [word, ...c.path] }))

const core = coreProgram([engineeringModule, wikiModule, learnModule])
const program: Program = {
  name: 'kit',
  summary: core.summary,
  commands: [...core.commands, ...under('eng', engineeringProgram.commands), ...under('wiki', wikiProgram.commands), ...under('learn', learnProgram.commands)],
}

// `kit engineering …` is the long spelling of `kit eng …`
const argv = takeRoleFlags(process.argv.slice(2))
if (argv[0] === 'engineering') argv[0] = 'eng'
process.exit(await run(program, argv))
