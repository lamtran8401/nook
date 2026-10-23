import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

import { arg, list, type Program, run } from '../src/cli.ts'
import { refused } from '../src/errors.ts'

let out: string
let err: string
const realOut = process.stdout.write.bind(process.stdout)
const realErr = process.stderr.write.bind(process.stderr)

beforeEach(() => {
  out = ''
  err = ''
  process.stdout.write = ((chunk: string) => ((out += chunk), true)) as typeof process.stdout.write
  process.stderr.write = ((chunk: string) => ((err += chunk), true)) as typeof process.stderr.write
})
afterEach(() => {
  process.stdout.write = realOut
  process.stderr.write = realErr
})

const program: Program = {
  name: 'nook',
  summary: 'the test program',
  commands: [
    {
      path: ['eng', 'item', 'show'],
      summary: 'show one item',
      usage: '<id>',
      flags: { area: { type: 'string', list: true } },
      run(c) {
        c.out({ id: arg(c, 0, 'item id'), areas: list(c, 'area') }, v => `${v.id} in ${v.areas.join(' and ')}`)
      },
    },
    {
      path: ['eng', 'item', 'approve'],
      summary: 'approve one item',
      run() {
        throw refused('approve SHOP-1: 1 gap\n- the plan is empty\n    fix: /plan SHOP-1', '/plan SHOP-1')
      },
    },
    { path: ['doctor'], summary: 'the gaps', run: () => 1 },
  ],
}

describe('run', () => {
  test('runs the command with its argument and its flags, and prints its text', async () => {
    expect(await run(program, ['eng', 'item', 'show', 'SHOP-1', '--area', 'bff,web'])).toBe(0)
    expect(out).toBe('SHOP-1 in bff and web\n')
  })

  test('a list flag takes every word after it up to the next flag', async () => {
    await run(program, ['eng', 'item', 'show', 'SHOP-1', '--area', 'bff', 'web', 'api', '--json'])
    expect(JSON.parse(out)).toEqual({ id: 'SHOP-1', areas: ['bff', 'web', 'api'] })
  })

  test('the words after a list flag are not arguments of the command', async () => {
    await run(program, ['eng', 'item', 'show', '--area', 'bff', 'web'])
    expect(err).toContain('give the item id')
  })

  test('prints the value as JSON with --json', async () => {
    await run(program, ['eng', 'item', 'show', 'SHOP-1', '--area', 'bff', '--json'])
    expect(JSON.parse(out)).toEqual({ id: 'SHOP-1', areas: ['bff'] })
  })

  test('returns the exit code of the command', async () => {
    expect(await run(program, ['doctor'])).toBe(1)
  })

  test('a group word alone prints the help of its commands and exits 0', async () => {
    expect(await run(program, ['eng'])).toBe(0)
    expect(err).toBe('')
    expect(out).toContain('nook eng item show <id>')
    expect(out).not.toContain('nook doctor')
  })

  test('an unknown word exits 2 and names it', async () => {
    expect(await run(program, ['frob'])).toBe(2)
    expect(err).toBe('nook: unknown command "frob"\n\n')
  })

  test('a missing argument exits 2 with the usage line', async () => {
    expect(await run(program, ['eng', 'item', 'show'])).toBe(2)
    expect(err).toBe('nook eng item show: give the item id\nusage: nook eng item show <id>\n')
  })

  test('an unknown flag exits 2 and points to --help', async () => {
    expect(await run(program, ['doctor', '--nope'])).toBe(2)
    expect(err).toContain('fix: run with --help to see the flags\n')
  })

  test('a refusal exits 3 and prints the fix once when the message holds it already', async () => {
    expect(await run(program, ['eng', 'item', 'approve'])).toBe(3)
    expect(err).toBe('nook eng item approve: approve SHOP-1: 1 gap\n- the plan is empty\n    fix: /plan SHOP-1\n')
  })
})
