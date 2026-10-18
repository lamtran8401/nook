/**
 * Whether this hook runs in a Claude Code session that a tool started: a session whose nearest Claude process
 * reaches another Claude session through a shell, as the Bash tool makes it. A session that the owner starts in a
 * terminal has no Claude process above it, and a background session has only the daemon and the pty host of Claude.
 */

import { runCommand } from '@nook/shared/run.ts'

const CLAUDE = /(^|\/)claude(\s|$)|\/claude\/versions\/|claude-code\//
const INFRA = /\s(?:daemon|bg-pty-host)(\s|$)/

/** The commands of the ancestors of a process, the nearest first. */
export function ancestorCommands(pid = process.ppid, limit = 40): string[] {
  const chain: string[] = []
  for (let current = pid, i = 0; current > 1 && i < limit; i++) {
    const m = /^\s*(\d+)\s+(.*)$/.exec(runCommand(['ps', '-o', 'ppid=,command=', '-p', String(current)]).out.trim())
    if (!m) break
    chain.push(m[2]!)
    current = Number(m[1])
  }
  return chain
}

/** True when a Claude session stands anywhere above the process: an agent shell, whatever its environment says. */
export const underClaude = (chain: string[]): boolean => chain.some(command => CLAUDE.test(command))

/** True when Claude runs this session in the background: its spare and its pty host stand above the hook. */
export function inBackground(chain: string[]): boolean {
  return chain.some(command => CLAUDE.test(command) && /\sbg-(?:spare|pty-host)(\s|$)/.test(command))
}

/** True when a shell stands between the nearest Claude session and another Claude session above it. */
export function startedByTool(chain: string[]): boolean {
  const first = chain.findIndex(c => CLAUDE.test(c) && !INFRA.test(c))
  if (first < 0) return false
  let throughShell = false
  for (const command of chain.slice(first + 1)) {
    if (CLAUDE.test(command)) {
      if (INFRA.test(command)) return false
      return throughShell
    }
    throughShell = true
  }
  return false
}
