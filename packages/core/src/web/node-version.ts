import { type CommandRun, runCommand } from '@nook/shared/run.ts'

/** The CLI runs on Bun, and the web app on Node 24 or later. */

export const NODE_MAJOR = 24
export type WebGap = { text: string; fix: string }

const FIX = `install Node ${NODE_MAJOR}, such as \`brew install node@${NODE_MAJOR}\`, then run nook web again`

export function nodeGap(run: (argv: string[]) => CommandRun = runCommand): WebGap | null {
  const version = run(['node', '--version'])
  if (version.code !== 0) return { text: `nook web needs Node ${NODE_MAJOR} or later; no node is on the path`, fix: FIX }
  const found = version.out.trim()
  const major = Number(/^v(\d+)\./.exec(found)?.[1] ?? 0)
  return major >= NODE_MAJOR ? null : { text: `nook web needs Node ${NODE_MAJOR} or later; this is ${found}`, fix: FIX }
}
