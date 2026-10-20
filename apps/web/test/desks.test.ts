import { describe, expect, test } from 'bun:test'

import { deskBySlug, listDesks } from '@/lib/desks.ts'

describe('the desks of the web app', () => {
  test('the desk where nook web started comes first, then each desk of the list once; a second folder name gets a number', () => {
    expect(listDesks('/w/personal', ['/b/chorus', '/w/personal', '/c/Personal Desk', '/d/personal'])).toEqual([
      { slug: 'personal', dir: '/w/personal', name: 'personal' },
      { slug: 'chorus', dir: '/b/chorus', name: 'chorus' },
      { slug: 'personal-desk', dir: '/c/Personal Desk', name: 'Personal Desk' },
      { slug: 'personal-2', dir: '/d/personal', name: 'personal' },
    ])
  })

  test('a slug finds its desk; a slug of no desk finds none', () => {
    const desks = listDesks('/w/personal', ['/b/chorus'])
    expect(deskBySlug('chorus', desks)?.dir).toBe('/b/chorus')
    expect(deskBySlug('ghost', desks)).toBeNull()
  })
})
