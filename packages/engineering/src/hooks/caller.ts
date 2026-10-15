import type { HookInput } from '@kit/shared/hook.ts'

import { type Role, Who } from '../who.ts'

/** Who sends a hook event, read from the hook input (docs/engineering.md section 9). */

export type CallerKind = 'lead' | 'builder' | 'verifier' | 'reviewer' | 'reader'

/** An in-process teammate can come with an id and no type; only builders run as teammates. */
const TEAMMATE_TYPE = 'teammate-builder'

/** The read-only agents of the engineering pack (`plugins/engineering/agents/`). */
const READERS = new Set(['verifier', 'reviewer', 'code-reviewer', 'scout', 'skeptic', 'system-designer', 'contract-designer', 'data-modeler'])

export class Caller {
  constructor(
    readonly role: Role,
    readonly actor: string,
    readonly kind: CallerKind,
  ) {}

  static readonly lead = new Caller('lead', 'lead', 'lead')

  /**
   * No agent type and no agent id is the lead; a type that ends in `builder` is a builder; the read-only agents of
   * the pack are readers. Any other agent works for the lead, so it gets the rules of the lead.
   */
  static from(input: HookInput): Caller {
    if (!input.agent_type && !input.agent_id) return Caller.lead
    const type = input.agent_type ? (input.agent_type.split(':').pop() ?? input.agent_type) : TEAMMATE_TYPE
    const actor = `${type}-${(input.agent_id ?? '').slice(-4) || '0000'}`
    if (type.endsWith('builder')) return new Caller('builder', actor, 'builder')
    if (!READERS.has(type)) return new Caller('lead', actor, 'lead')
    return new Caller('reader', actor, type === 'verifier' || type === 'reviewer' ? type : 'reader')
  }
}

/** The caller as the tool knows it, in the session of the event. */
export const whoOf = (caller: Caller, session?: string) => new Who(caller.role, caller.actor, session ?? null)
