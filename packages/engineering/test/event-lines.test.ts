import { describe, expect, test } from 'bun:test'

import { eventLine } from '../src/read/event-lines.ts'
import type { Event } from '../src/stores/events.ts'

const event = (fields: Partial<Event>): Event => ({
  id: 1,
  item: 'SHOP-1',
  type: 'approve',
  from_state: null,
  to_state: null,
  actor: 'owner',
  role: 'owner',
  reason: null,
  at: '2026-10-15T09:40:00Z',
  ...fields,
})

describe('eventLine', () => {
  test('a move of the owner reads as a sentence about you', () => {
    expect(eventLine(event({ type: 'approve', from_state: 'planning', to_state: 'ready' }))).toEqual({
      at: '2026-10-15T09:40:00Z',
      title: 'You approved the plan',
      text: null,
      tone: 'primary',
    })
  })

  test('a move back keeps its reason and warns', () => {
    expect(eventLine(event({ type: 'reject', reason: 'AC2 has no evidence' }))).toMatchObject({
      title: 'You sent the item back to the build',
      text: 'AC2 has no evidence',
      tone: 'danger',
    })
  })

  test('the lead reads by its role, and a builder by its name', () => {
    expect(eventLine(event({ type: 'begin', actor: 'lead', role: 'lead' })).title).toBe('The lead began the build')
    expect(eventLine(event({ type: 'task', actor: 'backend-builder-ab12', role: 'builder', reason: 'T1 done' }))).toMatchObject({
      title: 'backend-builder-ab12 moved a slice',
      text: 'T1 done',
    })
  })

  test('a run where every check passed is a success, and a run with a failure is a danger', () => {
    expect(eventLine(event({ type: 'verify', role: 'lead', actor: 'lead', reason: '2/2 checks passed' })).tone).toBe('success')
    expect(eventLine(event({ type: 'verify', role: 'lead', actor: 'lead', reason: '1/2 checks passed' })).tone).toBe('danger')
  })

  test('a change of mode names the two modes', () => {
    expect(eventLine(event({ type: 'mode', from_state: 'normal', to_state: 'yolo' }))).toMatchObject({
      title: 'You changed the mode',
      text: 'normal → yolo',
    })
  })

  test('an event of a kind it does not know still reads', () => {
    expect(eventLine(event({ type: 'rename', actor: 'lead', role: 'lead', reason: 'a new title' }))).toMatchObject({
      title: 'The lead recorded rename',
      text: 'a new title',
      tone: 'neutral',
    })
  })
})
