import { describe, expect, test } from 'bun:test'

import { AreaTags, AreaTones } from '../components/Areas.tsx'
import { Cmd } from '../components/Cmd.tsx'
import { KindIcon, StateIcon, StateTag, Turn } from '../components/Marks.tsx'
import { areaTone } from '../components/tones.ts'
import { html, text } from './markup.ts'

describe('the state of an item', () => {
  test('its icon takes the tone of the state and fills its ring as far as the state is in the flow', () => {
    const review = html(<StateIcon state="review" />)
    expect(review).toContain('data-tone="warning"')
    expect(review).toContain('data-state="review"')
    expect(review).toContain('stroke-dasharray="13.35 31.42"')
  })

  test('done is a full disc with a check, and backlog a dashed ring', () => {
    expect(html(<StateIcon state="done" />)).toContain('<path d="M4.2 7.2l1.9 1.9 3.7-4"')
    expect(html(<StateIcon state="backlog" />)).toContain('stroke-dasharray="2 2"')
  })

  test('its tag is the icon and the name, in the tone of the state', () => {
    const tag = html(<StateTag state="framing" />)
    expect(tag).toStartWith('<span class="nk-state" data-tone="violet">')
    expect(text(tag)).toBe('framing')
  })
})

describe('the kind of an item', () => {
  test('a tile in the tone of the kind, named for a reader of the screen', () => {
    const feature = html(<KindIcon kind="feature" />)
    expect(feature).toStartWith('<span class="nk-kind" data-tone="success" title="feature" role="img" aria-label="feature">')
    expect(html(<KindIcon kind="fix" />)).toContain('data-tone="danger"')
  })
})

describe('whose turn it is', () => {
  test('the owner is YOU and the lead is AI, each with the move in its title', () => {
    expect(html(<Turn owner title="Your move: approve" />)).toBe('<span class="nk-turn" data-tone="primary" title="Your move: approve">YOU</span>')
    expect(html(<Turn owner={false} title="The lead runs /cook" />)).toBe('<span class="nk-turn" data-tone="violet" title="The lead runs /cook">AI</span>')
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
    expect(tags).toBe('<span class="nk-tags"><span class="nk-tag" data-tone="violet">web</span><span class="nk-tag" data-tone="primary">api</span></span>')
  })
})

describe('a command', () => {
  test('shows as code with a button that copies it', () => {
    const cmd = html(<Cmd text='nook eng answer SHOP-42 Q2 "<answer>"' />)
    expect(cmd).toStartWith('<code class="nk-cmd">nook eng answer SHOP-42 Q2 &quot;&lt;answer&gt;&quot;<button type="button" class="nk-cmd__copy" aria-label="Copy the command" title="Copy" data-copy="idle">')
  })
})
