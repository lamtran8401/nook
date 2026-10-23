import { Badge } from '@nook/ui/components/badge.tsx'
import { SettingRow, SettingRows } from '@nook/ui/components/setting-rows.tsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@nook/ui/components/table.tsx'

import { AreaTags } from '@/components/areas.tsx'
import { KindIcon } from '@/components/marks.tsx'
import type { WorkspaceSettings } from '@/lib/workspace.ts'

const Muted = ({ children }: { children: React.ReactNode }) => <p className="text-[13px] text-muted-foreground">{children}</p>

/** The setup of the workspace in one card: its features, its areas with their checks, the kinds it learned, its root cause types and its file. */
export function SettingsPage({ settings }: { settings: WorkspaceSettings }) {
  const eng = settings.engineering
  return (
    <SettingRows>
      <SettingRow title="Features" about={<>On where <code className="font-mono">nook.yml</code> has their section.</>}>
        <div className="flex flex-wrap gap-1.5">
          {settings.features.map(feature => (
            <span key={feature} className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 shadow-xs">
              <i data-tone="success" className="size-2 rounded-full bg-tone" aria-hidden="true" />
              {feature}
              <span className="text-muted-foreground">on</span>
            </span>
          ))}
        </div>
      </SettingRow>
      {eng ? (
        <>
          <SettingRow title="Areas" about="Where builders work.">
            <Table>
              <TableHeader>
                <TableRow><TableHead>Area</TableHead><TableHead>Folder</TableHead><TableHead>Kind</TableHead><TableHead>Checks</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {eng.areas.map(a => (
                  <TableRow key={a.name}><TableCell><AreaTags names={[a.name]} /></TableCell><TableCell className="font-mono text-xs">{a.path}</TableCell><TableCell>{a.kind}</TableCell><TableCell className="font-mono text-xs">{a.checks.join(' · ') || 'none'}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </SettingRow>
          <SettingRow title="Learned kinds" about="Learned from your answers, with no setup.">
            {eng.kinds.length ? (
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Ticket type</TableHead><TableHead>Kind</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {eng.kinds.map(k => (
                    <TableRow key={k.type}><TableCell>{k.type}</TableCell><TableCell><span className="inline-flex items-center gap-1.5"><KindIcon kind={k.kind} />{k.kind}</span></TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Muted>None yet: /specify asks the first time it meets a ticket type.</Muted>
            )}
          </SettingRow>
          <SettingRow title="Root cause types" about="A fix names one at submit.">
            {eng.rootCauses.length ? (
              <div className="flex flex-wrap gap-1.5">{eng.rootCauses.map(c => <Badge key={c} tone={c === eng.unknownRootCause ? 'warning' : 'neutral'}>{c}</Badge>)}</div>
            ) : (
              <Muted>No list: any type passes. Write <code className="font-mono">engineering.rootCauses</code> in nook.yml to check them.</Muted>
            )}
          </SettingRow>
        </>
      ) : null}
      <SettingRow title="File" about="Edit it to change a feature or an area.">
        <code className="font-mono text-xs [overflow-wrap:anywhere]">{settings.file}</code>
      </SettingRow>
    </SettingRows>
  )
}
