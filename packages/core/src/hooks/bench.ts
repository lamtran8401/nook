import { checkSpec } from '@nook/workspace/bench-check.ts'

/** The `bench` blocks of a Markdown file that do not draw, each with its line and its problems. */

export type BenchFault = { line: number; problems: string[] }

export function benchFaults(text: string): BenchFault[] {
  const lines = text.split('\n')
  const faults: BenchFault[] = []
  for (let i = 0; i < lines.length; i++) {
    if (lines[i]!.trim() !== '```bench') continue
    const start = i
    const body: string[] = []
    for (i++; i < lines.length && !/^\s*```\s*$/.test(lines[i]!); i++) body.push(lines[i]!)
    const problems = problemsOf(body.join('\n'))
    if (problems.length) faults.push({ line: start + 1, problems })
  }
  return faults
}

function problemsOf(json: string): string[] {
  let spec: unknown
  try {
    spec = JSON.parse(json)
  } catch (error) {
    return [`the block is not valid JSON: ${(error as Error).message}`]
  }
  return checkSpec(spec)
}

/** The faults as feedback for the agent that wrote the file. */
export const benchReport = (rel: string, faults: BenchFault[]): string =>
  faults.map(fault => `${rel}: the bench block at line ${fault.line} does not draw. Fix it:\n${fault.problems.map(p => `  - ${p}`).join('\n')}`).join('\n')
