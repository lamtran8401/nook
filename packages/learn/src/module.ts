import { existsSync, mkdirSync } from 'node:fs'
import { relative } from 'node:path'

import type { BriefLine, PackModule } from '@nook/desk/desks.ts'

import { dayOf, learnAt } from './learn.ts'

export const learnModule: PackModule = {
  name: 'learn',

  setup(dir) {
    const at = learnAt(dir)
    if (!at || existsSync(at.learn.dir)) return []
    mkdirSync(at.learn.dir, { recursive: true })
    return [`${relative(dir, at.learn.dir)}/`]
  },

  configured(dir) {
    return learnAt(dir)?.configured ?? true
  },

  doctor(dir) {
    const at = learnAt(dir)
    if (!at) return []
    return at.learn
      .courses()
      .filter(c => !c.isSetUp())
      .map(c => ({ level: 'warn' as const, where: 'learn', text: `${relative(dir, c.dir)} has no roadmap.md`, fix: `run /learn-setup ${c.name}` }))
  },

  /** Each course: the cards due today and a day with no practice yet wait for the owner; a practised day is done. */
  brief(dir, _since, now = new Date()) {
    const at = learnAt(dir)
    if (!at) return []
    const today = dayOf(now)
    return at.learn
      .courses()
      .filter(c => c.isSetUp())
      .flatMap((c): BriefLine[] => {
        const due = c.deck.due(today).length
        const practised = c.practisedOn(today)
        if (!due && practised) return [{ part: 'done', text: `${c.name}: practised today` }]
        const parts = [due ? `${due} card${due > 1 ? 's' : ''} due` : '', practised ? '' : 'no practice yet today'].filter(Boolean)
        return [{ part: 'waits', text: `${c.name}: ${parts.join(', ')}`, action: `/learn-today ${c.name}` }]
      })
  },
}
