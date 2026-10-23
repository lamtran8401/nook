'use client'

import { createContext, type ReactNode, useContext } from 'react'

import { Badge } from '@nook/ui/components/badge.tsx'

import { areaTone } from '@/components/tones.ts'

/** The areas of the workspace in the order of `nook.yml`; the layout passes them down, so each tag finds its tone. */
const WorkspaceAreas = createContext<string[]>([])

export function AreaTones({ names, children }: { names: string[]; children: ReactNode }) {
  return <WorkspaceAreas.Provider value={names}>{children}</WorkspaceAreas.Provider>
}

export function AreaTags({ names }: { names: string[] }) {
  const areas = useContext(WorkspaceAreas)
  return (
    <span className="inline-flex flex-wrap gap-1">
      {names.map(name => (
        <Badge variant="label" tone={areaTone(name, areas)} key={name}>{name}</Badge>
      ))}
    </span>
  )
}
