import { Badge } from '@nook/ui/components/badge.tsx'
import { InlineCode } from '@nook/ui/components/inline-code.tsx'
import { SectionHeader } from '@nook/ui/components/section-header.tsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@nook/ui/components/table.tsx'

import type { DeskSettings } from '@/lib/desk.ts'

const Muted = ({ children }: { children: React.ReactNode }) => <p className="text-sm text-muted-foreground">{children}</p>

/** The setup of the desk: its packs, its areas with their checks, the kinds it learned, its root cause types and its file. */
export function SettingsPage({ settings }: { settings: DeskSettings }) {
  const eng = settings.engineering
  return (
    <>
      <section className="grid gap-3">
        <SectionHeader title="Packs" count={settings.packs.length} />
        <div className="flex flex-wrap gap-1.5">
          {settings.packs.map(pack => (
            <Badge key={pack} variant="outline">{pack}</Badge>
          ))}
        </div>
      </section>
      {eng ? (
        <>
          <section className="grid gap-3">
            <SectionHeader title="Areas" count={eng.areas.length} />
            <Table>
              <TableHeader>
                <TableRow><TableHead>Area</TableHead><TableHead>Path</TableHead><TableHead>Kind</TableHead><TableHead>Checks</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {eng.areas.map(a => (
                  <TableRow key={a.name}><TableCell className="font-medium">{a.name}</TableCell><TableCell className="font-mono text-xs">{a.path}</TableCell><TableCell>{a.kind}</TableCell><TableCell className="font-mono text-xs">{a.checks.join(' · ') || 'none'}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
          <section className="grid gap-3">
            <SectionHeader title="Kinds learned" count={eng.kinds.length} />
            {eng.kinds.length ? <ul className="grid gap-1 text-sm">{eng.kinds.map(k => <li key={k.type}>{`${k.type} → ${k.kind}`}</li>)}</ul> : <Muted>None yet: /spec asks the first time it meets a ticket type.</Muted>}
          </section>
          <section className="grid gap-3">
            <SectionHeader title="Root causes" count={eng.rootCauses.length} />
            {eng.rootCauses.length ? (
              <div className="flex flex-wrap gap-1.5">{eng.rootCauses.map(c => <Badge key={c} tone={c === eng.unknownRootCause ? 'warning' : 'neutral'}>{c}</Badge>)}</div>
            ) : (
              <Muted>No list: any type passes. Write <InlineCode>engineering.rootCauses</InlineCode> in nook.yml to check them.</Muted>
            )}
          </section>
        </>
      ) : null}
      <section className="grid gap-3">
        <SectionHeader title="File" />
        <InlineCode>{settings.file}</InlineCode>
      </section>
    </>
  )
}
