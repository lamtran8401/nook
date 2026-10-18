import type { Home } from '../home.ts'
import type { Ledger } from '../ledger.ts'
import type { Who } from '../who.ts'
import { AdrStore } from './adrs.ts'
import { ApprovalStore } from './approvals.ts'
import { CheckStore } from './checks.ts'
import { CriterionStore } from './criteria.ts'
import { EventStore } from './events.ts'
import { GuessStore } from './guesses.ts'
import { InstallStore } from './installs.ts'
import { ItemStore } from './items.ts'
import { NoteStore } from './notes.ts'
import { QuestionStore } from './questions.ts'
import { SessionStore } from './sessions.ts'
import { SliceStore } from './slices.ts'

/** One store for each table of the ledger, and the ADR files. */
export class Stores {
  readonly items: ItemStore
  readonly events: EventStore
  readonly approvals: ApprovalStore
  readonly criteria: CriterionStore
  readonly slices: SliceStore
  readonly questions: QuestionStore
  readonly guesses: GuessStore
  readonly checks: CheckStore
  readonly installs: InstallStore
  readonly notes: NoteStore
  readonly sessions: SessionStore
  readonly adrs: AdrStore

  constructor(ledger: Ledger, who: Who, home: Home) {
    this.items = new ItemStore(ledger)
    this.events = new EventStore(ledger, who)
    this.approvals = new ApprovalStore(ledger)
    this.criteria = new CriterionStore(ledger)
    this.slices = new SliceStore(ledger)
    this.questions = new QuestionStore(ledger)
    this.guesses = new GuessStore(ledger)
    this.checks = new CheckStore(ledger)
    this.installs = new InstallStore(ledger)
    this.notes = new NoteStore(ledger)
    this.sessions = new SessionStore(ledger, who)
    this.adrs = new AdrStore(home.adrDir)
  }
}
