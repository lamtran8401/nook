import { describe, expect, test } from 'bun:test'

import { CopyCommand } from '@nook/ui/components/copy-command.tsx'

import { AreaTags, AreaTones } from '@/components/areas.tsx'
import { KindIcon, StateIcon, StateTag, Turn } from '@/components/marks.tsx'
import { areaTone } from '@/components/tones.ts'
import { html, text } from '@/test/markup.ts'

describe('the state of an item', () => {
  test('its icon takes the tone of the state and fills its ring as far as the state is in the flow', () => {
    const review = html(<StateIcon state="review" />)
    expect(review).toContain('data-tone="warning"')
    expect(review).toContain('stroke-dasharray="13.35 31.42"')
  })

  test('done is a full disc with a check, and backlog a dashed ring', () => {
    expect(html(<StateIcon state="done" />)).toContain('<path d="M4.2 7.2l1.9 1.9 3.7-4"')
    expect(html(<StateIcon state="backlog" />)).toContain('stroke-dasharray="2 2"')
  })

  test('its tag is the icon and the name, in the tone of the state', () => {
    const tag = html(<StateTag state="framing" />)
    expect(tag).toStartWith('<span data-slot="badge" data-tone="violet" data-variant="soft"')
    expect(text(tag)).toBe('framing')
  })
})

describe('the kind of an item', () => {
  test('a tile in the tone of the kind, named for a reader of the screen', () => {
    expect(html(<KindIcon kind="feature" />)).toStartWith('<span data-slot="icon-tile" data-tone="success" role="img" aria-label="feature"')
    expect(html(<KindIcon kind="fix" />)).toContain('data-tone="danger"')
  })
})

describe('whose turn it is', () => {
  test('the owner is YOU and the lead is AI, each with the move in its title', () => {
    const you = html(<Turn owner title="Your move: approve" />)
    expect(you).toContain('data-tone="primary" data-variant="solid"')
    expect(you).toContain('title="Your move: approve"')
    expect(text(you)).toBe('YOU')
    const lead = html(<Turn owner={false} title="The lead runs /cook" />)
    expect(lead).toContain('data-tone="violet"')
    expect(text(lead)).toBe('AI')
  })
})

describe('the areas of an item', () => {
  test('each area of the desk keeps one tone, by its place in nook.yml', () => {
    expect(areaTone('api', ['api', 'web', 'worker'])).toBe('primary')
    expect(areaTone('web', ['api', 'web', 'worker'])).toBe('violet')
    expect(areaTone('worker', ['api', 'web', 'worker'])).toBe('aqua')
    expect(areaTone('ghost', ['api', 'web'])).toBe('neutral')
  })

  test('the tags read the areas of the desk from the page', () => {
    const tags = html(<AreaTones names={['api', 'web']}><AreaTags names={['web', 'api']} /></AreaTones>)
    expect([...tags.matchAll(/data-tone="(\w+)" data-variant="label"[^>]*>(\w+)</g)].map(m => `${m[2]}:${m[1]}`)).toEqual(['web:violet', 'api:primary'])
  })
})

describe('a command', () => {
  test('shows as code with a button that copies it', () => {
    const cmd = html(<CopyCommand text='nook eng answer SHOP-42 Q2 "<answer>"' />)
    expect(cmd).toContain('aria-label="Copy the command"')
    expect(text(cmd)).toBe('nook eng answer SHOP-42 Q2 "<answer>"')
  })
})
