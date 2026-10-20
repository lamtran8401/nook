import type { Area } from '../config.ts'
import { SpecDocument } from '../documents/spec.ts'
import { TasksDocument } from '../documents/tasks.ts'
import { WorkFolder } from '../documents/work-folder.ts'
import { type Flow, flowOf } from '../flows.ts'
import type { Home } from '../home.ts'
import type { Stores } from '../stores/index.ts'
import type { Item } from '../stores/items.ts'

/** What a move lacks, and the command that fixes it. */
export type Gap = { text: string; fix: string }

export interface Guard {
  check(ctx: GuardContext): Gap[]
}

/** A guard that looks at one area of the item at a time. */
export interface AreaGuard {
  checkArea(ctx: GuardContext, area: Area): Gap[]
}

/** The item under a guard, with its documents read once. */
export class GuardContext {
  readonly folder: WorkFolder
  private specDoc: SpecDocument | null | undefined
  private tasksDoc: TasksDocument | null | undefined

  constructor(
    readonly home: Home,
    readonly stores: Stores,
    readonly item: Item,
  ) {
    this.folder = new WorkFolder(home.workDir(item.id))
  }

  get id(): string {
    return this.item.id
  }

  /** What the kind of the item asks for, from its flow file. */
  get flow(): Flow {
    return flowOf(this.item.kind)
  }

  /** True when the slice guards apply: the flow needs slices, or allows them and the item has a tasks.md or a slice. */
  slicesApply(): boolean {
    const { slices } = this.flow
    if (slices === 'none') return false
    return slices === 'required' || this.tasks() !== null || this.stores.slices.live(this.id).length > 0
  }

  spec(): SpecDocument | null {
    if (this.specDoc === undefined) {
      const text = this.folder.read('spec.md')
      this.specDoc = text === null ? null : SpecDocument.parse(text)
    }
    return this.specDoc
  }

  tasks(): TasksDocument | null {
    if (this.tasksDoc === undefined) {
      const text = this.folder.read('tasks.md')
      this.tasksDoc = text === null ? null : TasksDocument.parse(text)
    }
    return this.tasksDoc
  }

  /** tasks.md when it exists and parses with no problem; the other slice guards look only at such a file. */
  cleanTasks(): TasksDocument | null {
    const tasks = this.tasks()
    return tasks && !tasks.problems.length ? tasks : null
  }
}
