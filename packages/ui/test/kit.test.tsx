import { describe, expect, test } from 'bun:test'
import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { ActionList, ActionRow } from '@nook/ui/components/action-list.tsx'
import { Callout } from '@nook/ui/components/callout.tsx'
import { CopyCommand } from '@nook/ui/components/copy-command.tsx'
import { DetailList, Detail } from '@nook/ui/components/detail-list.tsx'
import { Diagram } from '@nook/ui/components/diagram.tsx'
import { EmptyState } from '@nook/ui/components/empty-state.tsx'
import { Group, GroupCount, GroupLine } from '@nook/ui/components/group.tsx'
import { IconTile } from '@nook/ui/components/icon-tile.tsx'
import { LinkTabs } from '@nook/ui/components/link-tabs.tsx'
import { RecordList } from '@nook/ui/components/record-list.tsx'
import { PercentRing, RingIcon } from '@nook/ui/components/ring.tsx'
import { StatTile } from '@nook/ui/components/stat-tile.tsx'
import { Stepper } from '@nook/ui/components/stepper.tsx'
import { Tag } from '@nook/ui/components/tag.tsx'

const html = (node: ReactElement) => renderToStaticMarkup(node)
const text = (markup: string) => markup.replace(/<[^>]+>/g, ' ').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()

describe('Tag', () => {
  test('shows its words in its tone and variant', () => {
    const tag = html(<Tag tone="violet">framing</Tag>)
    expect(tag).toContain('data-slot="tag"')
    expect(tag).toContain('data-tone="violet"')
    expect(tag).toContain('data-variant="soft"')
    expect(text(tag)).toBe('framing')
  })

  test('takes the solid and the label variants', () => {
    expect(html(<Tag tone="primary" variant="solid">YOU</Tag>)).toContain('data-variant="solid"')
    expect(html(<Tag tone="aqua" variant="label">api</Tag>)).toContain('data-variant="label"')
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
    expect(tabs).toContain('aria-label="Packs"')
    expect(tabs).toContain('href="/works" aria-current="page"')
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
