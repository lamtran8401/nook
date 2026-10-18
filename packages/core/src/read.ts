import type { BriefLine, Finding, PackModule } from '@nook/desk/desks.ts'

import { briefSources, collectBrief, startOfYesterday } from './brief/brief.ts'
import { doctor } from './doctor/doctor.ts'

/** The read path of the home page of the web app: the brief of one desk and the findings of its doctor. */

export type HomeView = { dir: string; brief: BriefLine[]; findings: Finding[] }

export function readHome(desk: string, modules: PackModule[], now = new Date()): HomeView {
  const { findings } = doctor(desk, { modules })
  const [folder] = collectBrief([desk], startOfYesterday(now), { ...briefSources(modules), gaps: () => findings })
  return { dir: desk, brief: folder?.lines ?? [], findings }
}
