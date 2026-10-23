import type { ReactNode } from 'react'

import { Badge } from '@nook/ui/components/badge.tsx'
import { SettingRow, SettingRows } from '@nook/ui/components/setting-rows.tsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@nook/ui/components/table.tsx'

import { AreaTags } from '@/components/areas.tsx'
import { KindIcon } from '@/components/marks.tsx'
import type { Harness } from '@/lib/workspace.ts'

const Muted = ({ children }: { children: ReactNode }) => <p className="text-[13px] text-muted-foreground">{children}</p>
const Code = ({ children }: { children: ReactNode }) => <code className="font-mono">{children}</code>

const BUDGET_ABOUT = {
  lean: 'A skill starts at most one fresh reviewer and one builder for a second area.',
  deep: 'A skill starts the agents that the work needs.',
}

const COMMAND_LISTS = [
  { key: 'allow', label: 'Allow', tone: 'success' },
  { key: 'ask', label: 'Ask', tone: 'warning' },
  { key: 'deny', label: 'Deny', tone: 'danger' },
] as const

function Chips({ words, tone = 'neutral' }: { words: string[]; tone?: string }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {words.map(word => (
        <Badge key={word} tone={tone} className="font-mono">
          {word}
        </Badge>
      ))}
    </div>
  )
}

function FeatureChips({ features }: { features: Harness['features'] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {features.map(feature => (
        <span key={feature.name} className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 shadow-xs">
          <i data-tone="success" className="size-2 rounded-full bg-tone" aria-hidden="true" />
          {feature.name}
          <span className="text-muted-foreground">{feature.from ? `from ${feature.from}` : 'on'}</span>
        </span>
      ))}
    </div>
  )
}

function BudgetLine({ budget }: { budget: Harness['budget'] }) {
  if (!budget) return <p className="text-[13px] text-warning">Not a known budget: write lean or deep in nook.yml.</p>
  return (
    <p className="flex items-baseline gap-2 text-[13px]">
      <span className="font-medium">{budget}</span>
      <span className="text-muted-foreground">{BUDGET_ABOUT[budget]}</span>
    </p>
  )
}

function CommandLists({ commands }: { commands: Harness['commands'] }) {
  return (
    <dl className="grid grid-cols-[56px_minmax(0,1fr)] items-baseline gap-x-3 gap-y-2 text-[13px]">
      {COMMAND_LISTS.map(list => (
        <div key={list.key} className="contents">
          <dt className="inline-flex items-center gap-1.5 text-muted-foreground">
            <i data-tone={list.tone} className="size-1.5 rounded-full bg-tone" aria-hidden="true" />
            {list.label}
          </dt>
          <dd>{commands[list.key].length ? <Chips words={commands[list.key]} /> : <span className="text-faint">none</span>}</dd>
        </div>
      ))}
    </dl>
  )
}

function RuleChips({ rules }: { rules: Harness['rules'] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {rules.map(rule => (
        <Badge key={rule.name} tone="neutral" className={rule.on ? undefined : 'text-faint line-through'}>
          {rule.name}
          {rule.on ? null : <span className="sr-only"> off</span>}
        </Badge>
      ))}
    </div>
  )
}

function HookList({ hooks }: { hooks: Harness['hooks'] }) {
  return (
    <ul className="grid gap-2.5 text-[13px]">
      {hooks.map(hook => (
        <li key={`${hook.event} ${hook.matcher}`} className="min-w-0">
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-medium">{hook.event}</span>
            <span className="font-mono text-xs text-muted-foreground [overflow-wrap:anywhere]">{hook.matcher ?? 'all'}</span>
          </p>
          <p className="flex flex-wrap gap-x-3 font-mono text-xs text-muted-foreground">
            {hook.commands.map(command => <span key={command}>{command}</span>)}
          </p>
        </li>
      ))}
    </ul>
  )
}

function EngineeringRows({ eng }: { eng: NonNullable<Harness['engineering']> }) {
  return (
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
          <Muted>No list: any type passes. Write <Code>engineering.rootCauses</Code> in nook.yml to check them.</Muted>
        )}
      </SettingRow>
    </>
  )
}

/** The harness of the workspace as its nook.yml sets it: the features, the agent budget, the guards, the rules, the hooks, the engineering setup and the file. */
export function HarnessPage({ harness }: { harness: Harness }) {
  return (
    <SettingRows>
      <SettingRow title="Features" about={<>On where <Code>nook.yml</Code> has their section.</>}>
        <FeatureChips features={harness.features} />
      </SettingRow>
      <SettingRow title="Agent budget" about="How many agents a skill starts.">
        <BudgetLine budget={harness.budget} />
      </SettingRow>
      <SettingRow title="Secrets" about="No agent reads or writes them.">
        <div className="flex flex-wrap gap-1.5">
          <Chips words={harness.secrets.always} />
          <Chips words={harness.secrets.listed} tone="primary" />
        </div>
      </SettingRow>
      <SettingRow title="Commands" about="What an agent runs, asks for first, or never runs.">
        <CommandLists commands={harness.commands} />
      </SettingRow>
      <SettingRow title="Rules" about="The base rules that each agent reads.">
        <RuleChips rules={harness.rules} />
      </SettingRow>
      <SettingRow title="Hooks" about="What the plugin checks at each event.">
        <HookList hooks={harness.hooks} />
      </SettingRow>
      {harness.engineering ? <EngineeringRows eng={harness.engineering} /> : null}
      <SettingRow title="File" about="Edit it to change the harness.">
        <code className="font-mono text-xs [overflow-wrap:anywhere]">{harness.file}</code>
      </SettingRow>
    </SettingRows>
  )
}
