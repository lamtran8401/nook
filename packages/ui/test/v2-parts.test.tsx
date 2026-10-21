import { describe, expect, test } from 'bun:test'
import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { Badge } from '@nook/ui/components/badge.tsx'
import { Button } from '@nook/ui/components/button.tsx'
import { Input } from '@nook/ui/components/input.tsx'
import { Kbd } from '@nook/ui/components/kbd.tsx'
import { Menu, MenuTrigger } from '@nook/ui/components/menu.tsx'
import { SidePanelBody, SidePanelFooter, SidePanelHeader } from '@nook/ui/components/side-panel.tsx'
import { toasts } from '@nook/ui/components/toast.tsx'

const html = (element: ReactElement) => renderToStaticMarkup(element)
const classOf = (markup: string, slot: string) => new RegExp(`data-slot="${slot}"[^>]*class="([^"]*)"`).exec(markup)?.[1] ?? ''

describe('the parts of kit v2', () => {
  test('the main button is ink and carries its key hint', () => {
    const markup = html(<Button>Approve <Kbd>A</Kbd></Button>)
    expect(classOf(markup, 'button')).toContain('bg-foreground')
    expect(markup).toContain('<kbd data-slot="kbd"')
    expect(markup).toContain('>A</kbd>')
  })

  test('every chip is a pill, and none is set in capitals', () => {
    for (const variant of ['soft', 'solid', 'outline', 'label'] as const) {
      const cls = classOf(html(<Badge tone="primary" variant={variant}>api</Badge>), 'badge')
      expect({ variant, pill: cls.includes('rounded-full'), caps: cls.includes('uppercase') }).toEqual({ variant, pill: true, caps: false })
    }
  })

  test('an input is a pill on the muted ground', () => {
    const cls = classOf(html(<Input placeholder="Recommended: the same card" />), 'input')
    expect(cls).toContain('rounded-full')
    expect(cls).toContain('bg-muted')
  })

  test('the trigger of a menu tells a screen reader that it opens a menu', () => {
    const markup = html(<Menu><MenuTrigger asChild><Button variant="outline">Display</Button></MenuTrigger></Menu>)
    expect(markup).toContain('aria-haspopup="menu"')
    expect(markup).toContain('>Display</button>')
  })

  test('a side panel has a header, a body that scrolls and a footer for the moves', () => {
    const markup = html(<div><SidePanelHeader>SHOP-42</SidePanelHeader><SidePanelBody>overview</SidePanelBody><SidePanelFooter>Approve</SidePanelFooter></div>)
    expect(markup).toContain('data-slot="side-panel-header"')
    expect(classOf(markup, 'side-panel-body')).toContain('overflow-auto')
    expect(markup).toContain('data-slot="side-panel-footer"')
  })

  test('a toast shows its words and goes when it is dismissed', () => {
    const id = toasts.add('Copied /close SHOP-41')
    expect(toasts.list().map(t => t.text)).toEqual(['Copied /close SHOP-41'])
    toasts.remove(id)
    expect(toasts.list()).toEqual([])
  })
})
