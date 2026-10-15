import type { Gap, Guard, GuardContext } from './guard.ts'

export class NoOpenBlockingQuestion implements Guard {
  check(ctx: GuardContext): Gap[] {
    return ctx.stores.questions.openBlocking(ctx.id).map(q => ({
      text: `${q.id} is open and blocking: ${q.text}`,
      fix: `ask the owner, then kit eng answer ${ctx.id} ${q.id} "<answer>"`,
    }))
  }
}
