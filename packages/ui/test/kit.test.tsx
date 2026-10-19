import { describe, expect, test } from 'bun:test'
import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { ActionBar } from '@nook/ui/components/action-bar.tsx'
import { ActionList, ActionRow } from '@nook/ui/components/action-list.tsx'
import { Badge } from '@nook/ui/components/badge.tsx'
import { Callout } from '@nook/ui/components/callout.tsx'
import { Checklist } from '@nook/ui/components/checklist.tsx'
import { CodeBlock } from '@nook/ui/components/code-block.tsx'
import { ChangeList } from '@nook/ui/components/change-list.tsx'
import { CopyCommand } from '@nook/ui/components/copy-command.tsx'
import { CountTile } from '@nook/ui/components/count-tile.tsx'
import { DetailList, Detail } from '@nook/ui/components/detail-list.tsx'
import { Diagram } from '@nook/ui/components/diagram.tsx'
import { Disclosure } from '@nook/ui/components/disclosure.tsx'
import { EmptyState } from '@nook/ui/components/empty-state.tsx'
import { Group, GroupCount, GroupLine } from '@nook/ui/components/group.tsx'
import { IconTile } from '@nook/ui/components/icon-tile.tsx'
import { InlineCode } from '@nook/ui/components/inline-code.tsx'
import { Legend } from '@nook/ui/components/legend.tsx'
import { LinkTabs } from '@nook/ui/components/link-tabs.tsx'
import { OutList } from '@nook/ui/components/out-list.tsx'
import { PieceGrid } from '@nook/ui/components/piece-grid.tsx'
import { Prose } from '@nook/ui/components/prose.tsx'
import { Quote } from '@nook/ui/components/quote.tsx'
import { RecordList } from '@nook/ui/components/record-list.tsx'
import { RuleList } from '@nook/ui/components/rule-list.tsx'
import { PercentRing, RingIcon } from '@nook/ui/components/ring.tsx'
import { Section } from '@nook/ui/components/section.tsx'
import { StatTile } from '@nook/ui/components/stat-tile.tsx'
import { StepList } from '@nook/ui/components/step-list.tsx'
import { Stepper } from '@nook/ui/components/stepper.tsx'
import { TaskCard } from '@nook/ui/components/task-card.tsx'

const html = (node: ReactElement) => renderToStaticMarkup(node)
const text = (markup: string) => markup.replace(/<[^>]+>/g, ' ').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()

describe('Badge', () => {
  test('shows its words in its tone, soft by default', () => {
    const badge = html(<Badge tone="violet">framing</Badge>)
    expect(badge).toContain('data-slot="badge" data-tone="violet" data-variant="soft"')
    expect(text(badge)).toBe('framing')
  })

  test('takes the solid and the label variants of the kit', () => {
    expect(html(<Badge tone="primary" variant="solid">YOU</Badge>)).toContain('data-variant="solid"')
    expect(html(<Badge tone="aqua" variant="label">api</Badge>)).toContain('data-variant="label"')
  })
})

describe('IconTile', () => {
  test('holds its mark in its tone, and names it for a reader of the screen when it has a label', () => {
    const tile = html(<IconTile tone="danger" label="urgent">!</IconTile>)
    expect(tile).toContain('data-tone="danger"')
    expect(tile).toContain('role="img" aria-label="urgent"')
    expect(text(tile)).toBe('!')
  })
})

describe('the rings', () => {
  test('a ring icon fills its share of the circle, a full one is a disc with a check, an empty one is dashed', () => {
    expect(html(<RingIcon fill={0.85} tone="warning" />)).toContain('stroke-dasharray="13.35 31.42"')
    expect(html(<RingIcon fill={1} tone="success" />)).toContain('<path d="M4.2 7.2l1.9 1.9 3.7-4"')
    expect(html(<RingIcon fill={0} tone="neutral" />)).toContain('stroke-dasharray="2 2"')
  })

  test('a percent ring names its share', () => {
    const ring = html(<PercentRing value={25} tone="success" />)
    expect(ring).toContain('aria-label="25%"')
    expect(text(ring)).toBe('25%')
  })
})

describe('CopyCommand', () => {
  test('shows the command as code with a button that copies it', () => {
    const cmd = html(<CopyCommand text='nook eng answer SHOP-42 Q2 "<answer>"' />)
    expect(cmd).toContain('<code data-slot="copy-command"')
    expect(cmd).toContain('aria-label="Copy the command"')
    expect(text(cmd)).toBe('nook eng answer SHOP-42 Q2 "<answer>"')
  })
})

describe('Group', () => {
  test('gives a head that links to what the lines are about, and the lines under it', () => {
    const group = html(
      <Group head={<>resources <GroupCount n={2} /></>} href="/wiki/resources">
        <GroupLine mark="L5" end="system">Shipments api</GroupLine>
      </Group>,
    )
    expect(group).toContain('href="/wiki/resources"')
    expect(text(group)).toBe('resources 2 L5 Shipments api system')
  })

  test('a head with no link is plain', () => {
    expect(html(<Group head="This desk"><GroupLine>words</GroupLine></Group>)).not.toContain('<a')
  })
})

describe('RecordList', () => {
  test('gives each row its id, its words, the line under them and its end', () => {
    expect(text(html(<RecordList rows={[{ id: 'AC1', main: 'A saved card pays', sub: 'cards.test.ts', end: 'met' }, { id: 'AC2', main: 'A decline shows why' }]} />))).toBe('AC1 A saved card pays cards.test.ts met AC2 A decline shows why')
  })
})

describe('ActionList', () => {
  test('gives each row a mark in its tone, a title, a note and its action', () => {
    const list = html(<ActionList><ActionRow tone="danger" icon="?" title="Q2: Same card?" note="Blocking" act={<button type="button">Answer</button>} /></ActionList>)
    expect(list).toContain('data-tone="danger"')
    expect(text(list)).toBe('? Q2: Same card? Blocking Answer')
  })
})

describe('Callout', () => {
  test('gives a label and a body in one tone, as a note', () => {
    const callout = html(<Callout tone="primary" icon="i" label="In short">Pages of 20.</Callout>)
    expect(callout).toContain('role="note"')
    expect(callout).toContain('data-tone="primary"')
    expect(text(callout)).toBe('i In short Pages of 20.')
  })
})

describe('EmptyState', () => {
  test('says what is missing and what fills it; compact fits a section', () => {
    expect(text(html(<EmptyState icon="·" title="No slice yet">The plan writes them.</EmptyState>))).toBe('· No slice yet The plan writes them.')
    expect(html(<EmptyState compact icon="·" title="x" />)).toContain('data-size="compact"')
  })
})

describe('StatTile', () => {
  test('gives a label, a value with its unit, and a part beside them', () => {
    expect(text(html(<StatTile label="Criteria met" value="1" unit=" / 4" aside={<PercentRing value={25} tone="success" />} />))).toBe('Criteria met 1 / 4 25%')
  })
})

describe('Stepper', () => {
  test('marks each step done, current or upcoming; a done step gets a check, the others their number', () => {
    const steps = html(<Stepper steps={[{ key: 'a', label: 'backlog', state: 'done', desc: '14 Oct' }, { key: 'b', label: 'cooking', state: 'current' }, { key: 'c', label: 'done', state: 'upcoming' }]} />)
    expect([...steps.matchAll(/data-state="(\w+)"/g)].map(m => m[1])).toEqual(['done', 'current', 'upcoming'])
    expect(text(steps)).toBe('backlog 14 Oct 2 cooking 3 done')
  })
})

describe('LinkTabs', () => {
  test('marks the current tab for a reader of the screen', () => {
    const tabs = html(<LinkTabs label="Packs" tabs={[{ href: '/', label: 'Home' }, { href: '/works', label: 'Works', current: true }]} />)
    expect(tabs).toContain('<nav aria-label="Packs"')
    expect(/<a [^>]*href="\/works"[^>]*>/.exec(tabs)![0]).toContain('aria-current="page"')
    expect(/<a [^>]*href="\/"[^>]*>/.exec(tabs)![0]).not.toContain('aria-current')
  })
})

describe('DetailList', () => {
  test('gives each detail its label and its value', () => {
    const list = html(<DetailList><Detail label="State">cooking</Detail><Detail label="Size">L</Detail></DetailList>)
    expect(list).toContain('<dt')
    expect(text(list)).toBe('State cooking Size L')
  })
})

describe('Diagram', () => {
  test('keeps its spec for the Bench library, which draws it after the page loads', () => {
    expect(html(<Diagram spec={{ type: 'board', columns: [] }} />)).toContain('data-diagram="{&quot;type&quot;:&quot;board&quot;,&quot;columns&quot;:[]}"')
  })
})

describe('CountTile', () => {
  test('gives the count over its label, in its tone', () => {
    const tile = html(<CountTile count={2} label="Urgent" tone="danger" />)
    expect(tile).toContain('data-tone="danger"')
    expect(text(tile)).toBe('2 Urgent')
  })
})

describe('Disclosure', () => {
  test('keeps its words in the page while it is closed, so a reader of the source and a search find them', () => {
    const part = html(<Disclosure summary="All questions · 3">Q1 Which currency?</Disclosure>)
    expect(part).toContain('aria-expanded="false"')
    expect(text(part)).toBe('All questions · 3 Q1 Which currency?')
  })
})

describe('Section', () => {
  test('gives its title as a heading over what it holds', () => {
    expect(html(<Section title="Needs you"><p>x</p></Section>)).toContain('<h2 class="text-[19px] font-semibold">Needs you</h2><p>x</p>')
  })
})

describe('ActionBar', () => {
  test('gives the label, the mark, the words and the action, in that order', () => {
    expect(text(html(<ActionBar label="Next step" mark={<b>YOU</b>} action={<button type="button">Approve</button>}>Your move: approve</ActionBar>))).toBe('Next step YOU Your move: approve Approve')
  })
})

describe('ChangeList', () => {
  test('gives each branch its head, its files and its lines added and removed', () => {
    expect(text(html(<ChangeList changes={[{ key: 'api', head: 'api', files: 2, add: 132, del: 4, end: '1 pass' }]} />))).toBe('api 2 files +132 −4 1 pass')
  })
})

describe('InlineCode', () => {
  test('keeps its words as code', () => {
    expect(html(<InlineCode>nook/SHOP-42</InlineCode>)).toStartWith('<code data-slot="inline-code"')
  })
})

describe('the parts of a document', () => {
  test('a checklist marks each thing done or open', () => {
    const list = html(<Checklist items={[{ done: true, content: 'one' }, { done: false, content: 'two' }]} />)
    expect([...list.matchAll(/data-state="(\w+)"/g)].map(m => m[1])).toEqual(['done', 'open'])
    expect(text(list)).toBe('one two')
  })

  test('a code block keeps each line and names its language', () => {
    expect(text(html(<CodeBlock lang="ts" text={'const a = 1\nconst b = 2\n'} />))).toBe('ts const a = 1 const b = 2')
  })

  test('a quote, a legend, an out list, pieces, a task and the prose keep their words', () => {
    expect(text(html(<Quote>Pages of 20.</Quote>))).toBe('Pages of 20.')
    expect(html(<Legend items={[['primary', 'new']]} />)).toContain('data-tone="primary"')
    expect(text(html(<OutList items={['a store credit']} />))).toBe('a store credit')
    expect(text(html(<PieceGrid pieces={[{ title: 'api', content: 'one page' }]} />))).toBe('api one page')
    expect(text(html(<TaskCard kicker="T1" title="Add the table" rows={[['Proof', 'a test']]} foot="starts first" />))).toBe('T1 Add the table Proof a test starts first')
    expect(html(<Prose><p>x</p></Prose>)).toStartWith('<div data-slot="prose"')
  })

  test('a rule list gives the § mark in the tone of the rule, its words and its sources', () => {
    const rules = html(<RuleList rules={[{ label: 'Same card', content: 'A refund goes back.', tone: 'warning', end: 'Q2' }]} />)
    expect(rules).toContain('data-tone="warning"')
    expect(text(rules)).toBe('§ Same card A refund goes back. Q2')
  })

  test('a step list numbers its steps', () => {
    expect(text(html(<StepList variant="path" items={[{ title: 'Open the page', text: 'the list shows' }, { title: 'Pick a status' }]} />))).toBe('1 Open the page the list shows 2 Pick a status')
  })
})
