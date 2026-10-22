import { describe, expect, test } from 'bun:test'
import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { ActionBar } from '@nook/ui/components/action-bar.tsx'
import { Badge } from '@nook/ui/components/badge.tsx'
import { Callout } from '@nook/ui/components/callout.tsx'
import { Checklist } from '@nook/ui/components/checklist.tsx'
import { CodeBlock } from '@nook/ui/components/code-block.tsx'
import { ChangeList } from '@nook/ui/components/change-list.tsx'
import { CopyCommand } from '@nook/ui/components/copy-command.tsx'
import { CriterionCards } from '@nook/ui/components/criterion-cards.tsx'
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
import { ReceiptList } from '@nook/ui/components/receipt-list.tsx'
import { RuleList } from '@nook/ui/components/rule-list.tsx'
import { PercentRing, RingIcon } from '@nook/ui/components/ring.tsx'
import { InboxRow } from '@nook/ui/components/inbox-row.tsx'
import { SegmentBar } from '@nook/ui/components/segment-bar.tsx'
import { Sparkline } from '@nook/ui/components/sparkline.tsx'
import { StepList } from '@nook/ui/components/step-list.tsx'
import { Tally } from '@nook/ui/components/tally.tsx'
import { TaskCard } from '@nook/ui/components/task-card.tsx'
import { TrendTile } from '@nook/ui/components/trend-tile.tsx'

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

  test('a percent ring at nought draws no arc, so its round end leaves no dot', () => {
    expect(html(<PercentRing value={0} />).match(/<circle/g)).toHaveLength(1)
  })

  test('a percent ring with a label shows the label in its middle', () => {
    const ring = html(<PercentRing value={20} label="1/5" />)
    expect(ring).toContain('aria-label="1/5"')
    expect(text(ring)).toBe('1/5')
  })
})

describe('Tally', () => {
  test('gives each row its dot, its name and its value', () => {
    expect(text(html(<Tally rows={[{ tone: 'success', label: 'met', value: 1 }, { tone: 'danger', label: 'blocked', value: 2 }]} />))).toBe('met 1 blocked 2')
  })
})

describe('SegmentBar', () => {
  test('gives each part a width by its size and the name under it', () => {
    const markup = html(<SegmentBar label="Time" parts={[{ key: 'backlog', tone: 'neutral', size: 3, label: 'backlog' }, { key: 'framing', tone: 'violet', size: 1 }]} />)
    expect([...markup.matchAll(/flex:(\d+)/g)].map(m => m[1])).toEqual(['3', '1'])
    expect(text(markup)).toBe('backlog')
  })
})

describe('Sparkline', () => {
  test('draws the points from left to right, the highest at the top, and breaks the line at a point with no data', () => {
    const lines = [...html(<Sparkline label="Rework" points={[0, 50, null, 100]} />).matchAll(/points="([^"]*)"/g)].map(m => m[1])
    expect(lines).toEqual(['0.0,27.0 33.3,15.0', '100.0,3.0'])
  })

  test('a flat trend sits in the middle', () => {
    expect(html(<Sparkline label="Cycle" points={[5, 5]} />)).toContain('points="0.0,15.0 100.0,15.0"')
  })
})

describe('TrendTile', () => {
  test('gives the label, the value with its unit, the trend and the line under it', () => {
    const markup = html(<TrendTile label="Rework rate" value="25" unit="%" points={[1, 2]} tone="danger" note="1 of 4 sent back" />)
    expect(text(markup)).toBe('Rework rate 25 % 1 of 4 sent back')
    expect(markup).toContain('aria-label="Rework rate, one point for each week"')
  })
})

describe('InboxRow', () => {
  test('gives the id, the title, the line under it, the actions and the part that acts in place; the picked row is marked', () => {
    const markup = html(<InboxRow tone="danger" id="SHOP-43" title="Export the list" sub="Waits for your approve" actions={<button type="button">Approve</button>} below={<input aria-label="answer" />} selected />)
    expect(text(markup)).toBe('SHOP-43 Export the list Waits for your approve Approve')
    expect(markup).toStartWith('<li data-slot="inbox-row" data-selected="true"')
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

describe('Disclosure', () => {
  test('keeps its words in the page while it is closed, so a reader of the source and a search find them', () => {
    const part = html(<Disclosure summary="All questions · 3">Q1 Which currency?</Disclosure>)
    expect(part).toContain('aria-expanded="false"')
    expect(text(part)).toBe('All questions · 3 Q1 Which currency?')
  })
})

describe('ActionBar', () => {
  test('gives the round mark, the label over the words, and the action, in that order', () => {
    expect(text(html(<ActionBar label="Next · You" mark="YOU" action={<button type="button">Approve</button>}>Approve the plan</ActionBar>))).toBe('YOU Next · You Approve the plan Approve')
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

  test('a rule list gives an open rule a clock in its tone and a settled rule a check, then its words and its sources', () => {
    const rules = html(<RuleList rules={[{ label: 'Same card', content: 'A refund goes back.', tone: 'warning', end: 'Q2' }, { label: 'Token', content: 'Only a token.' }]} />)
    expect([...rules.matchAll(/data-tone="(\w+)"[^>]*><svg[^>]*lucide-(clock|check)/g)].map(m => `${m[1]} ${m[2]}`)).toEqual(['warning clock', 'violet check'])
    expect(text(rules)).toBe('Same card A refund goes back. Q2 Token Only a token.')
  })

  test('the criterion cards give each criterion its state mark, number, tag, words, sources and state', () => {
    const cards = html(<CriterionCards items={[{ n: 1, tag: { text: 'ADD', tone: 'success' }, content: 'Pays in one click.', meta: 'ticket AC1', state: { text: 'met', tone: 'success', done: true } }, { n: 2, content: 'Shows the reason.' }]} />)
    expect(text(cards)).toBe('AC 1 add Pays in one click. ticket AC1 met AC 2 Shows the reason.')
    expect([...cards.matchAll(/lucide-(check|clock)/g)].map(m => m[1])).toEqual(['check', 'clock'])
  })

  test('the receipt list gives the time, the mark of who did it, the sentence and its proof', () => {
    expect(text(html(<ReceiptList rows={[{ key: 'a', time: '09:42', mark: 'BB', who: 'backend-builder', tone: 'success', title: 'finished T2', text: 'proof ok' }]} />))).toBe('09:42 BB finished T2 proof ok')
  })

  test('a step list numbers its steps', () => {
    expect(text(html(<StepList variant="path" items={[{ title: 'Open the page', text: 'the list shows' }, { title: 'Pick a status' }]} />))).toBe('1 Open the page the list shows 2 Pick a status')
  })
})
