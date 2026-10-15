import { activePacks, nearestEnvironment } from '@kit/env/env.ts'
import { context, type HookInput, type HookResult, pass } from '@kit/shared/hook.ts'

export function sessionStart(input: HookInput): HookResult {
  const cwd = input.cwd ?? process.cwd()
  const env = nearestEnvironment(cwd)
  if (!env) return pass
  const packs = ['core', ...activePacks(cwd).map(p => p.name)]
  return context('SessionStart', `Harness Kit environment: ${env.dir}. Packs on: ${packs.join(', ')}. The base rules are in .claude/rules/kit/. Run \`kit doctor\` for the environments above and every gap.`)
}
