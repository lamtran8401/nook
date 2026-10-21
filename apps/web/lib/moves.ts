import { runCommand } from '@nook/shared/run.ts'

/**
 * The owner moves of a page: approve or accept at a gate, a send back from review with its reason, the mode, the
 * answer to a question, and the decision on a guess. Each one runs the nook CLI with `--via viewer`, so it meets the same guards as a move typed with /gate.
 */

export type MoveResult = { ok: boolean; lines: string[] }
export type MoveForm = Record<string, string>

const ID = /^[A-Za-z][\w.]*-\d+$/
const field = (form: MoveForm, name: string) => (form[name] ?? '').trim()

/** The words after `nook` for a move of the form, or the reason that the form is not a move. */
export function moveArgs(form: MoveForm): string[] | { refused: string } {
  const item = field(form, 'item')
  if (!ID.test(item)) return { refused: `${item || 'no item'} is no item id` }
  const kind = field(form, 'kind')
  const tail = (words: string[]) => ['--via', 'viewer', '--', item, ...words]
  if (kind === 'gate') {
    const move = field(form, 'move')
    return move === 'approve' || move === 'accept' ? ['eng', 'item', move, ...tail([])] : { refused: `${move} is no move of the owner` }
  }
  if (kind === 'back') {
    const reason = field(form, 'reason')
    // the reason rides in one word with its flag, so a reason that starts with a dash stays the reason
    return reason ? ['eng', 'item', 'reject', '--via', 'viewer', `--reason=${reason}`, '--', item] : { refused: 'say why it goes back first' }
  }
  if (kind === 'mode') {
    const mode = field(form, 'mode')
    return mode === 'yolo' || mode === 'normal' ? ['eng', 'item', 'mode', ...tail([mode])] : { refused: `${mode} is no mode` }
  }
  if (kind === 'answer') {
    const question = field(form, 'question').toUpperCase()
    const text = field(form, 'answer')
    if (!/^Q\d+$/.test(question)) return { refused: `${question} is no question` }
    return text ? ['eng', 'answer', ...tail([question, text])] : { refused: 'type the answer first' }
  }
  if (kind === 'guess') {
    const guess = field(form, 'guess').toUpperCase()
    const decision = field(form, 'decision')
    if (!/^G\d+$/.test(guess)) return { refused: `${guess} is no guess` }
    return decision === 'accept' || decision === 'flip' ? ['eng', 'guess', decision, ...tail([guess])] : { refused: `${decision} is no decision on a guess` }
  }
  return { refused: `${kind || 'nothing'} is no owner move` }
}

/** The command of the nook that started the web app, from NOOK_CLI; `nook` on the path when it is not set or broken. */
export function nookCommand(env: NodeJS.ProcessEnv = process.env): string[] {
  const named = parsed(env.NOOK_CLI)
  return Array.isArray(named) && named.length && named.every(word => typeof word === 'string') ? named : ['nook']
}

function parsed(json: string | undefined): unknown {
  if (!json) return null
  try {
    return JSON.parse(json)
  } catch {
    // a broken value is the same as none: nook on the path still runs the move through its guards
    return null
  }
}

/** Runs the move in the desk; a refused move gives the lines of the CLI, its gaps and their fixes, word for word. */
export function runMove(form: MoveForm, desk: string, env: NodeJS.ProcessEnv = process.env): MoveResult {
  const args = moveArgs(form)
  if (!Array.isArray(args)) return { ok: false, lines: [args.refused] }
  const run = runCommand([...nookCommand(env), ...args], { cwd: desk, env, timeoutMs: 120_000 })
  const text = (run.code === 0 ? run.out : run.err.trim() || run.out).trim()
  const lines = text.split('\n').filter(line => line.trim())
  // a move that dies with no words, such as a time limit or a program that does not start, still says so
  return { ok: run.code === 0, lines: lines.length || run.code === 0 ? lines : [`the move did not finish (exit ${run.code})`] }
}
