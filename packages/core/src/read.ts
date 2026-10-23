import type { BriefLine, Finding, FeatureModule } from '@nook/workspace/workspaces.ts'

import { briefSources, collectBrief, startOfYesterday } from './brief/brief.ts'
import { doctor } from './doctor/doctor.ts'

/** The read path of the home page of the web app: the brief of one workspace and the findings of its doctor. */

export type HomeView = { dir: string; brief: BriefLine[]; findings: Finding[] }

export function readHome(workspace: string, modules: FeatureModule[], now = new Date()): HomeView {
  const { findings } = doctor(workspace, { modules })
  const [folder] = collectBrief([workspace], startOfYesterday(now), { ...briefSources(modules), gaps: () => findings })
  return { dir: workspace, brief: folder?.lines ?? [], findings }
}
