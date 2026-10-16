import { activePacks, type PackModule } from '@kit/env/env.ts'
import { block, context, type HookInput, type HookResult, pass } from '@kit/shared/hook.ts'

import { ancestorCommands, startedByTool } from './session.ts'

/**
 * UserPromptExpansion of /gate and of the typed commands of a pack, as /auto: they run as the owner because the owner
 * typed them. Claude Code fires this event only for a command that a person types, never for a skill that the model
 * calls; the hook also refuses an agent and a session that a tool started.
 */

export type GateDeps = { modules: PackModule[]; startedByTool?: () => boolean }

const EVENT = 'UserPromptExpansion'

export function gateHook(input: HookInput, deps: GateDeps): HookResult {
  const name = String(input.command_name ?? '').replace(/^.*:/, '')
  if (name !== 'gate' && !deps.modules.some(m => m.commands?.includes(name))) return pass
  if (input.agent_id || input.agent_type) return block(`/${name} runs only from the prompt of the owner, not inside an agent.`)
  const nested = deps.startedByTool ?? (() => startedByTool(ancestorCommands()))
  if (nested()) return block(`/${name} runs only in a session that the owner started, not in a session that a tool started.`)
  const cwd = input.cwd ?? process.cwd()
  const active = activePacks(cwd)
  const modules = deps.modules.filter(m => active.some(p => p.name === m.name))
  const homeOf = (m: PackModule) => active.find(p => p.name === m.name)!.home.dir
  const args = String(input.command_args ?? '').trim()
  if (name !== 'gate') return typedCommand(name, args, modules, homeOf, input.session_id ?? null)
  const words = args.split(/\s+/).filter(Boolean)
  if (!words.length) return context(EVENT, waitingText(modules, homeOf))
  const owner = modules.find(m => m.gates?.includes(words[0]!))
  if (!owner?.gate) {
    const moves = modules.flatMap(m => m.gates ?? [])
    return block(`no pack here has the owner move "${words[0]}". The moves here: ${moves.join(', ') || 'none'}.`)
  }
  const result = owner.gate(homeOf(owner), words, input.session_id ?? null)
  const head = `Kit gate: the owner typed /gate ${words.join(' ')}. ${result.ok ? 'The move ran.' : 'The move was refused.'}`
  return context(EVENT, [head, ...result.lines].join('\n'))
}

function typedCommand(name: string, args: string, modules: PackModule[], homeOf: (m: PackModule) => string, session: string | null): HookResult {
  const owner = modules.find(m => m.commands?.includes(name))
  if (!owner?.command) return pass
  const result = owner.command(homeOf(owner), name, args, session)
  const head = `Kit ${name}: the owner typed /${name}${args ? ` ${args}` : ''}. ${result.ok ? 'It ran.' : 'It was refused.'}`
  return context(EVENT, [head, ...result.lines].join('\n'))
}

function waitingText(modules: PackModule[], homeOf: (m: PackModule) => string): string {
  const waiting = modules.flatMap(m => m.waiting?.(homeOf(m)) ?? [])
  if (!waiting.length) return 'Kit gate: no owner move waits now.'
  return ['Kit gate: the owner moves that wait now:', ...waiting.map(w => `- /gate ${w.words} (${w.why})`)].join('\n')
}
