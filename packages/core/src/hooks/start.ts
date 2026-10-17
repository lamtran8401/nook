import { activePacks, nearestEnvironment } from '@nook/env/env.ts'
import { context, type HookInput, type HookResult, pass } from '@nook/shared/hook.ts'

export function sessionStart(input: HookInput): HookResult {
  const cwd = input.cwd ?? process.cwd()
  const env = nearestEnvironment(cwd)
  if (!env) return pass
  const packs = ['core', ...activePacks(cwd).map(p => p.name)]
  return context('SessionStart', `Nook environment: ${env.dir}. Packs on: ${packs.join(', ')}. The base rules are in .claude/rules/nook/. Run \`nook doctor\` for the environments above and every gap.`)
}
