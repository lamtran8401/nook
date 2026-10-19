'use client'

import { createContext, type ReactNode, useContext } from 'react'

import { Badge } from '@nook/ui/components/badge.tsx'

import { areaTone } from '@/components/tones.ts'

/** The areas of the desk in the order of `nook.yml`; the layout passes them down, so each tag finds its tone. */
const DeskAreas = createContext<string[]>([])

export function AreaTones({ names, children }: { names: string[]; children: ReactNode }) {
  return <DeskAreas.Provider value={names}>{children}</DeskAreas.Provider>
}

export function AreaTags({ names }: { names: string[] }) {
  const areas = useContext(DeskAreas)
  return (
    <span className="inline-flex flex-wrap gap-1">
      {names.map(name => (
        <Badge variant="label" tone={areaTone(name, areas)} key={name}>{name}</Badge>
      ))}
    </span>
  )
}
