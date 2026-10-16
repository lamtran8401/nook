import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { CARD_COLUMNS, CardDeck } from './cards.ts'
import { MdTable } from './table.ts'

/** One course of the owner in `learn/<name>/`: its roadmap, its mistakes, its scores, its cards and its study log. */

export type Mistake = { pattern: string; yours: string; fix: string }
export type Score = { task: string; criterion: string; band: string; evidence: string }
export type Pattern = { pattern: string; count: number; last: string }

const ROADMAP = (name: string) =>
  [
    `# Roadmap: ${name}`,
    '',
    '> In short: <the goal, the date and the minutes each day; /learn-setup writes it>',
    '',
    '## Goal',
    '',
    '## The map and the ruler',
    '',
    '## Levels now',
    '',
    '| Skill | Level | From the task |',
    '|---|---|---|',
    '',
    '## Milestones',
    '',
    '| Month | Target |',
    '|---|---|',
    '',
    '## The loop',
    '',
    '## Captures',
    '',
    'off',
    '',
  ].join('\n')

export class Course {
  readonly deck: CardDeck
  private readonly mistakes: MdTable
  private readonly scoreTable: MdTable
  private readonly study: MdTable

  constructor(
    readonly dir: string,
    readonly name: string,
  ) {
    this.deck = new CardDeck(join(dir, 'cards', 'cards.md'))
    this.mistakes = new MdTable(join(dir, 'mistakes.md'), 'Mistakes', ['Date', 'Pattern', 'Yours', 'Fix'])
    this.scoreTable = new MdTable(join(dir, 'scores.md'), 'Scores', ['Date', 'Task', 'Criterion', 'Band', 'Evidence'])
    this.study = new MdTable(join(dir, 'study.md'), 'Study', ['Date', 'Topic', 'Page'])
  }

  isSetUp(): boolean {
    return existsSync(join(this.dir, 'roadmap.md'))
  }

  /** Makes each file of the course that is missing; returns what it made. A file that exists stays as it is. */
  create(): string[] {
    const made: string[] = []
    const make = (rel: string, write: () => void) => {
      if (existsSync(join(this.dir, rel))) return
      write()
      made.push(rel)
    }
    make('roadmap.md', () => {
      mkdirSync(this.dir, { recursive: true })
      writeFileSync(join(this.dir, 'roadmap.md'), ROADMAP(this.name))
    })
    make('mistakes.md', () => this.mistakes.write([]))
    make('scores.md', () => this.scoreTable.write([]))
    make('cards/cards.md', () => new MdTable(join(this.dir, 'cards', 'cards.md'), 'Cards', CARD_COLUMNS).write([]))
    make('study.md', () => this.study.write([]))
    return made
  }

  addMistake(m: Mistake, today: string): void {
    this.mistakes.append([today, m.pattern, m.yours, m.fix])
  }

  /** The patterns that come back most, then the latest; the lesson of the day works on the first one. */
  topPatterns(n: number): Pattern[] {
    const by = new Map<string, Pattern>()
    for (const [date = '', pattern = ''] of this.mistakes.rows()) {
      const p = by.get(pattern) ?? { pattern, count: 0, last: '' }
      p.count++
      if (date > p.last) p.last = date
      by.set(pattern, p)
    }
    return [...by.values()].sort((a, b) => b.count - a.count || b.last.localeCompare(a.last)).slice(0, n)
  }

  addScore(s: Score, today: string): void {
    this.scoreTable.append([today, s.task, s.criterion, s.band, s.evidence])
  }

  scores(): (Score & { date: string })[] {
    return this.scoreTable.rows().map(([date = '', task = '', criterion = '', band = '', evidence = '']) => ({ date, task, criterion, band, evidence }))
  }

  addStudy(topic: string, page: string, today: string): void {
    this.study.append([today, topic, page])
  }

  /** A day counts as practised when it holds a mistake, a score or a card review. */
  practisedOn(day: string): boolean {
    return (
      this.mistakes.rows().some(([date]) => date === day) ||
      this.scoreTable.rows().some(([date]) => date === day) ||
      this.deck.list().some(c => c.last === day)
    )
  }
}
