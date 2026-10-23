import type { MoveName } from '../machine.ts'
import { AreaFree, BranchNotProtected, EachArea } from './areas.ts'
import { AutoByOwner } from './yolo.ts'
import { ChildrenDone } from './children.ts'
import { CriteriaMarked } from './criteria.ts'
import { DatesWritten } from './dates.ts'
import { FindingsFilled, QuestionsAnswered } from './findings.ts'
import { EditsOutsideSlices } from './edits.ts'
import { FingerprintsUnchanged } from './fingerprints.ts'
import type { Gap, Guard, GuardContext } from './guard.ts'
import { PlanFilled } from './plan.ts'
import { RootCauseWritten } from './root-cause.ts'
import { NoOpenBlockingQuestion } from './questions.ts'
import { EveryAcInSlice, NoDependsCycle, SliceAreasOfItem, SlicesDone, SlicesImported } from './slices.ts'
import { SpecParses } from './spec.ts'
import { VerifyPassed } from './verify.ts'

/** The guards of each move, in the order of their gaps. The first gap gives the fix of the refusal. */

const APPROVE: Guard[] = [
  new PlanFilled(),
  new DatesWritten(['plan.md', 'tasks.md']),
  new SlicesImported(),
  new EveryAcInSlice(),
  new SliceAreasOfItem(),
  new NoDependsCycle(),
  new NoOpenBlockingQuestion(),
]
const SPEC_ONLY = new FingerprintsUnchanged(['spec.md'])

export const GUARDS: Record<MoveName, Guard[]> = {
  start: [],
  agree: [new SpecParses(), new DatesWritten(['spec.md']), new NoOpenBlockingQuestion()],
  approve: APPROVE,
  proceed: [new AutoByOwner(), ...APPROVE],
  begin: [new EachArea(new AreaFree())],
  submit: [new FindingsFilled(), new RootCauseWritten(), new SlicesDone(), new VerifyPassed('slices')],
  accept: [new QuestionsAnswered(), new CriteriaMarked(), new ChildrenDone(), new VerifyPassed('quick')],
  reject: [],
  replan: [],
  reframe: [],
  reopen: [],
  block: [],
  unblock: [],
  cancel: [],
  restore: [],
}

/** The notes of the door: they inform the one who moves the item and never hold the move. */
export const NOTES: Partial<Record<MoveName, Guard[]>> = {
  begin: [new FingerprintsUnchanged(), new EachArea(new BranchNotProtected())],
  submit: [SPEC_ONLY],
  accept: [new FingerprintsUnchanged(), new EditsOutsideSlices()],
}

export const gapsOf = (ctx: GuardContext, move: MoveName): Gap[] =>
  GUARDS[move].flatMap(guard => guard.check(ctx))

export const notesOf = (ctx: GuardContext, move: MoveName): Gap[] => (NOTES[move] ?? []).flatMap(guard => guard.check(ctx))
