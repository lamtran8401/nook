import { activeFeatures, nearestWorkspace } from '@nook/workspace/workspaces.ts'
import { context, type HookInput, type HookResult, pass } from '@nook/shared/hook.ts'

export function sessionStart(input: HookInput): HookResult {
  const cwd = input.cwd ?? process.cwd()
  const workspace = nearestWorkspace(cwd)
  if (!workspace) return pass
  const features = activeFeatures(cwd).map(f => f.name)
  return context('SessionStart', `Nook workspace: ${workspace.dir}. Features on: ${features.join(', ')}. The base rules are in .claude/rules/nook/. Run \`nook doctor\` for the workspaces above and every gap.`)
}
