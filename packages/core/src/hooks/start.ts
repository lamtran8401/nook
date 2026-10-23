import { activeFeatures, nearestDesk } from '@nook/desk/desks.ts'
import { context, type HookInput, type HookResult, pass } from '@nook/shared/hook.ts'

export function sessionStart(input: HookInput): HookResult {
  const cwd = input.cwd ?? process.cwd()
  const desk = nearestDesk(cwd)
  if (!desk) return pass
  const features = activeFeatures(cwd).map(f => f.name)
  return context('SessionStart', `Nook desk: ${desk.dir}. Features on: ${features.join(', ')}. The base rules are in .claude/rules/nook/. Run \`nook doctor\` for the desks above and every gap.`)
}
