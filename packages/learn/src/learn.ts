import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { activePacks } from '@nook/env/env.ts'
import { EvError, Exit, usage } from '@nook/shared/errors.ts'

import { Course } from './course.ts'

/** The courses of one environment, in the folder that the `learn` section of nook.yml names. */
export class Learn {
  constructor(
    readonly home: string,
    readonly folder: string,
  ) {}

  get dir(): string {
    return join(this.home, this.folder)
  }

  courses(): Course[] {
    if (!existsSync(this.dir)) return []
    return readdirSync(this.dir, { withFileTypes: true })
      .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
      .map(entry => new Course(join(this.dir, entry.name), entry.name))
  }

  course(name: string): Course {
    return new Course(join(this.dir, name), name)
  }

  /** The course that a command names; with no name, the only course, as a command with no argument takes it from the record. */
  pick(name?: string): Course {
    if (name) return this.course(name)
    const courses = this.courses()
    if (courses.length === 1) return courses[0]!
    throw usage(
      courses.length ? `name the course: ${courses.map(c => c.name).join(', ')}` : 'no course yet',
      courses.length ? 'nook learn <command> <course>' : 'run /learn-setup <course>',
    )
  }
}

/** The local date of a time, as the course files write it. */
export const dayOf = (now = new Date()): string =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

const folderOf = (section: unknown): string | null => {
  if (section === undefined || section === null) return null
  const dir = (section as { dir?: unknown }).dir
  return typeof dir === 'string' && dir.trim() ? dir.trim() : 'learn'
}

/** The courses of the nearest environment above `cwd` that turns the pack on. */
export function findLearn(cwd = process.cwd()): Learn | null {
  const pack = activePacks(cwd).find(p => p.name === 'learn')
  return pack ? new Learn(pack.home.dir, folderOf(pack.home.config.section('learn')) ?? 'learn') : null
}

export function requireLearn(cwd = process.cwd()): Learn {
  const learn = findLearn(cwd)
  if (learn) return learn
  throw new EvError('not inside an environment that turns the learn pack on', Exit.error, 'add `learn` to `packs:` in nook.yml, then run /setup')
}

/** The learn of `dir` only when `dir` itself turns the pack on, and whether its section of nook.yml exists. */
export function learnAt(dir: string): { learn: Learn; configured: boolean } | null {
  const pack = activePacks(dir).find(p => p.name === 'learn')
  if (!pack || pack.home.dir !== dir) return null
  const folder = folderOf(pack.home.config.section('learn'))
  return { learn: new Learn(dir, folder ?? 'learn'), configured: folder !== null }
}
