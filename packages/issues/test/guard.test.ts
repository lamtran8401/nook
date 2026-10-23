import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { parseTwgMap, trackerHook, writeGuard } from '../src/guard.ts'

// lines of a real `twg help-map`, one of each form
const MAP = parseTwgMap(`twg help-map — every command
legend: plain = read, * = writes, ? = access unknown; (x) = alias
global options: -s/--site <site>, -o/--output text|json|jsonl, --output-summary none|stats|auto|inline

== TWG cross-product ==
commits — Hydrate commit ARIs: hash, author, repo
memory update* — Replace a memory's text
rovo deep-search?

== Products ==
bitbucket (bb): inbox
bitbucket pipeline — CI runs: logs, failures, reruns, triggers: get grep run* trigger*
jira board quick-filter: get query
jira workitem: archive* bulk-get clone* create* delete* get query search transition* update*
jira workitem attachment: delete* download get query thumbnail upload*
jira workitem comment: create* delete* query update*
jira workitem field (custom-fields): create-metadata update-metadata

== Setup and admin ==
(top level): doctor help help-map login* logout* whoami
help: describe discover-skills

next: twg help describe "<command>" ["<command>" ...]  # flags, inputs and output fields
`)

const verdict = (command: string) => writeGuard(command, () => MAP)

describe('the map of twg', () => {
  const marks = { read: '', write: '*', unknown: '?' }
  const lines = (text: string) => parseTwgMap(text).map(c => c.words.map(names => names.join('|')).join(' ') + marks[c.access])

  test('reads each form of line: a path, a group with its subcommands, a description with colons, the top level, an alias', () => {
    expect(lines('== A ==\ncommits — Hydrate commit ARIs: hash, author, repo\nrovo deep-search?\n== B ==\nbitbucket (bb): inbox\nbitbucket pipeline — CI runs: logs, triggers: get run*\njira workitem field (custom-fields): update-metadata\n== C ==\n(top level): whoami login*\nnext: twg help describe "<command>"\n')).toEqual([
      'commits', 'rovo deep-search?', 'bitbucket|bb inbox', 'bitbucket|bb pipeline get', 'bitbucket|bb pipeline run*', 'jira workitem field|custom-fields update-metadata', 'whoami', 'login*',
    ])
  })

  test('a text with no header of commands is no map', () => {
    expect(parseTwgMap('twg: unknown command "help-map"\n')).toEqual([])
  })
})

describe('the write guard of the trackers', () => {
  test('a read of gh passes: an issue view, a list, an api call with no write', () => {
    for (const command of ['gh issue view 482 --repo acme/shop --json title', 'gh issue list -R acme/shop', 'gh api repos/acme/shop/issues/482', 'gh api -X GET repos/acme/shop', 'gh auth status', 'gh --version', 'gh pr view 3'])
      expect([command, verdict(command)]).toEqual([command, null])
  })

  test('an issue write of gh is blocked, with the reason', () => {
    expect(verdict('gh issue comment 482 --body "done"')).toBe('gh issue comment writes to the tracker: the agents of this workspace only read tickets. Ask the owner to do it.')
    for (const command of ['gh issue create -t x', 'gh issue edit 482 --add-label x', 'gh issue close 482', 'gh issue delete 482', 'gh -R acme/shop issue reopen 9'])
      expect(verdict(command)).toContain('writes to the tracker')
  })

  test('a gh api call with a write method or fields is blocked', () => {
    for (const command of ['gh api -X POST repos/acme/shop/issues/1/comments', 'gh api --method=PATCH repos/x', 'gh api repos/x/issues -f title=y', 'gh api graphql -F query=@q.graphql', 'gh api repos/x --input body.json', 'gh api -Xdelete repos/x'])
      expect([command, verdict(command)]).toEqual([command, 'gh api with a write method or fields writes to the tracker: the agents of this workspace only read tickets. Ask the owner to do it.'])
  })

  test('a twg command passes when its map marks it a read, global options and their values skipped', () => {
    for (const command of ['twg jira workitem get SHOP-12 --full -o json', 'twg --site company.atlassian.net jira workitem get SHOP-12', 'twg -s x -o json jira workitem attachment download --attachment-id 1 --output-path a.png', 'twg whoami', 'twg --version', 'twg jira workitem comment query --issue-id SHOP-12', 'twg jira workitem field update-metadata --id SHOP-12', 'twg jira workitem custom-fields update-metadata --id SHOP-12', 'twg help describe "jira workitem get"', 'twg bb pipeline get 7', 'twg commits x'])
      expect([command, verdict(command)]).toEqual([command, null])
  })

  test('a twg write is blocked, and so is a command the map does not know or marks unknown', () => {
    expect(verdict('twg jira workitem update SHOP-12 --summary x')).toBe('twg jira workitem update writes to the tracker: the agents of this workspace only read tickets. Ask the owner to do it.')
    expect(verdict('twg jira workitem comment create --issue-id SHOP-12 --body x')).toContain('twg jira workitem comment create writes')
    expect(verdict('twg bb pipeline run 7')).toContain('twg bitbucket pipeline run writes')
    expect(verdict('twg login --site x')).toContain('twg login writes')
    expect(verdict('twg rovo deep-search x')).toBe('the guard cannot tell whether twg rovo deep-search writes to the tracker, so it blocks it. Ask the owner to run it.')
    expect(verdict('twg jira nothing-like-this')).toBe('the guard cannot tell whether twg jira nothing-like-this writes to the tracker, so it blocks it. Ask the owner to run it.')
  })

  test('a write hidden in a substitution, a script of sh -c or a later command is found', () => {
    expect(verdict('echo $(gh issue close 1)')).toContain('gh issue close writes')
    expect(verdict('sh -c "twg jira workitem update SHOP-1"')).toContain('twg jira workitem update writes')
    expect(verdict('gh issue view 1 && gh issue comment 1 -b x')).toContain('gh issue comment writes')
    expect(verdict("gh 'issue' \"comment\" 1")).toContain('gh issue comment writes')
    expect(verdict('bash <<EOF\ngh issue close 1\nEOF')).toContain('gh issue close writes')
    expect(verdict('echo "twg jira workitem update SHOP-1" | sh')).toContain('twg jira workitem update writes')
  })

  test('a call behind a wrapper, an assignment or a keyword is found', () => {
    for (const command of ['FOO=1 gh issue close 1', 'echo 1 | xargs -n1 gh issue close', 'env GH_HOST=x gh issue close 1', 'sudo -u bob /usr/local/bin/gh issue close 1', 'timeout 5 gh issue close 1', 'if true; then gh issue close 1; fi', 'find . -name x -exec twg jira workitem update SHOP-1 \\;'])
      expect([command, verdict(command)]).toEqual([command, expect.stringContaining('writes to the tracker')])
  })

  test('a command with no tracker CLI passes, also one that only names gh in its words', () => {
    expect(verdict('ls backlog')).toBeNull()
    expect(verdict('grep "gh issue comment" notes.md')).toBeNull()
    for (const command of ['grep -rn twg packages/issues/src', 'echo gh issue close 1', 'rg -l "twg jira" .', 'cat twg', 'ls ~/bin/twg'])
      expect([command, verdict(command)]).toEqual([command, null])
  })

  test('with no map of twg, each twg command but --version and --help is blocked', () => {
    expect(writeGuard('twg jira workitem get SHOP-1', () => null)).toBe('the guard could not read the command map of twg, so it blocks twg jira workitem get. Ask the owner to run it.')
    expect(writeGuard('twg --help', () => null)).toBeNull()
  })
})

describe('the hook of the write guard', () => {
  let root: string
  beforeEach(() => {
    root = realpathSync(mkdtempSync(join(tmpdir(), 'nook-issues-guard-')))
  })
  afterEach(() => rmSync(root, { recursive: true, force: true }))

  const bash = (command: string) => ({ tool_name: 'Bash', tool_input: { command }, cwd: root })

  test('in a workspace with the feature on, a write is blocked with its reason', () => {
    writeFileSync(join(root, 'nook.yml'), 'issue-tracker: {}\n')
    expect(trackerHook(bash('gh issue close 1'), () => MAP)).toEqual({ kind: 'block', reason: 'gh issue close writes to the tracker: the agents of this workspace only read tickets. Ask the owner to do it.' })
    expect(trackerHook(bash('twg jira workitem get SHOP-1'), () => MAP)).toEqual({ kind: 'pass' })
  })

  test('in a workspace with the feature off, a write passes', () => {
    writeFileSync(join(root, 'nook.yml'), 'secrets: []\n')
    expect(trackerHook(bash('gh issue close 1'), () => MAP)).toEqual({ kind: 'pass' })
  })

  test('the map of twg is read once for a line with several twg calls, and not at all with none', () => {
    writeFileSync(join(root, 'nook.yml'), 'issue-tracker: {}\n')
    let reads = 0
    const counted = () => (reads++, MAP)
    trackerHook(bash('twg whoami && twg jira workitem get SHOP-1'), counted)
    trackerHook(bash('gh issue view 1'), counted)
    expect(reads).toBe(1)
  })
})
