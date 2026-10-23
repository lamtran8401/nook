import { describe, expect, test } from 'bun:test'

import { workspaceBySlug, listWorkspaces } from '@/lib/workspaces.ts'

describe('the workspaces of the web app', () => {
  test('the workspace where nook web started comes first, then each workspace of the list once; a second folder name gets a number', () => {
    expect(listWorkspaces('/w/personal', ['/b/chorus', '/w/personal', '/c/Personal Workspace', '/d/personal'])).toEqual([
      { slug: 'personal', dir: '/w/personal', name: 'personal' },
      { slug: 'chorus', dir: '/b/chorus', name: 'chorus' },
      { slug: 'personal-workspace', dir: '/c/Personal Workspace', name: 'Personal Workspace' },
      { slug: 'personal-2', dir: '/d/personal', name: 'personal' },
    ])
  })

  test('a slug finds its workspace; a slug of no workspace finds none', () => {
    const workspaces = listWorkspaces('/w/personal', ['/b/chorus'])
    expect(workspaceBySlug('chorus', workspaces)?.dir).toBe('/b/chorus')
    expect(workspaceBySlug('ghost', workspaces)).toBeNull()
  })
})
