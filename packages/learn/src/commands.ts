import { type Context, type Program, text } from '@kit/shared/cli.ts'
import { usage } from '@kit/shared/errors.ts'

import type { Review } from './cards.ts'
import { dayOf, requireLearn } from './learn.ts'

/** The commands of the learn pack: the records of a course. The skills teach; these keep the cards, mistakes and scores exact. */

const need = (c: Context, flag: string): string => {
  const value = text(c, flag)
  if (!value) throw usage(`give --${flag}`)
  return value
}

const course = (c: Context, at = 0) => requireLearn().pick(c.args[at])

/** `card review` takes `[course] <id> good|again`: with three words the first is the course. */
export function reviewArgs(args: string[]): { name?: string; id: string; result: Review } {
  const [name, id, result] = args.length === 3 ? args : [undefined, ...args]
  if (!id || (result !== 'good' && result !== 'again')) throw usage('give the card and good or again', 'kit learn card review [course] C1 good')
  return { ...(name ? { name } : {}), id, result }
}

export const learnProgram: Program = {
  name: 'kit learn',
  summary: 'the learn pack of Harness Kit: the courses, their cards, mistakes and scores',
  commands: [
    {
      path: ['courses'],
      summary: 'the courses of this environment, each with its cards due today',
      run(c) {
        const today = dayOf()
        const list = requireLearn()
          .courses()
          .map(x => ({ name: x.name, setUp: x.isSetUp(), due: x.deck.due(today).length, practised: x.practisedOn(today) }))
        c.out(list, l => (l.length ? l.map(x => `${x.name}${x.setUp ? '' : ' (no roadmap)'}: ${x.due} due${x.practised ? ', practised today' : ''}`).join('\n') : 'no course yet: run /learn-setup <course>'))
      },
    },
    {
      path: ['course', 'new'],
      summary: 'make the files of a course: roadmap.md, mistakes.md, scores.md, cards/cards.md, study.md; a file that exists stays',
      usage: '<course>',
      run(c) {
        const name = c.args[0]
        if (!name) throw usage('give the name of the course, such as english')
        const made = requireLearn().course(name).create()
        c.out({ made }, r => (r.made.length ? `made: ${r.made.join(', ')}` : 'nothing to make'))
      },
    },
    {
      path: ['today'],
      summary: 'the day of a course: the cards due, the top patterns of the mistakes, and whether today is practised',
      usage: '[course]',
      run(c) {
        const x = course(c)
        const today = dayOf()
        const r = { course: x.name, due: x.deck.due(today), top: x.topPatterns(3), practised: x.practisedOn(today) }
        c.out(r, v =>
          [
            `${v.course}: ${v.due.length} cards due${v.practised ? ', practised today' : ''}`,
            ...v.due.map(card => `- ${card.id} ${card.front}`),
            `top patterns: ${v.top.map(p => `${p.pattern} (${p.count})`).join(', ') || 'none yet'}`,
          ].join('\n'),
        )
      },
    },
    {
      path: ['card', 'add'],
      summary: 'add a card; it comes back the next day',
      usage: '[course] --front <text> --back <text>',
      flags: { front: { type: 'string', help: 'the question or the point' }, back: { type: 'string', help: 'the answer, with an example' } },
      run(c) {
        const card = course(c).deck.add(need(c, 'front'), need(c, 'back'), dayOf())
        c.out(card, x => `${x.id} added, due ${x.due}`)
      },
    },
    {
      path: ['card', 'review'],
      summary: 'mark a card known (good) or missed (again); good comes back after 2, 4, 8, 16 days, again the next day',
      usage: '[course] <id> good|again',
      run(c) {
        const { name, id, result } = reviewArgs(c.args)
        const card = requireLearn().pick(name).deck.review(id, result, dayOf())
        c.out(card, v => `${v.id} box ${v.box}, due ${v.due}`)
      },
    },
    {
      path: ['mistake', 'add'],
      summary: 'log a mistake of the owner: its pattern, the sentence as written, the fix',
      usage: '[course] --pattern <name> --yours <text> --fix <text>',
      flags: {
        pattern: { type: 'string', help: 'the name of the pattern, such as articles' },
        yours: { type: 'string', help: 'the words as the owner wrote them' },
        fix: { type: 'string', help: 'the words as they should be' },
      },
      run(c) {
        course(c).addMistake({ pattern: need(c, 'pattern'), yours: need(c, 'yours'), fix: need(c, 'fix') }, dayOf())
        c.out({ ok: true }, () => 'logged')
      },
    },
    {
      path: ['top'],
      summary: 'the patterns of the mistakes that come back most',
      usage: '[course] [--n 3]',
      flags: { n: { type: 'string', help: 'how many patterns, 3 by default' } },
      run(c) {
        const top = course(c).topPatterns(Number(text(c, 'n') ?? 3))
        c.out(top, t => (t.length ? t.map(p => `${p.pattern}: ${p.count}, last ${p.last}`).join('\n') : 'no mistake yet'))
      },
    },
    {
      path: ['score', 'add'],
      summary: 'log a score on one criterion of the ruler, with the evidence that it rests on',
      usage: '[course] --task <name> --criterion <name> --band <n> --evidence <the words of the owner>',
      flags: {
        task: { type: 'string', help: 'the task, such as writing task 2' },
        criterion: { type: 'string', help: 'the criterion of the ruler, such as Lexical Resource' },
        band: { type: 'string', help: 'the band or the score' },
        evidence: { type: 'string', help: 'the words of the owner that the score rests on' },
      },
      run(c) {
        course(c).addScore({ task: need(c, 'task'), criterion: need(c, 'criterion'), band: need(c, 'band'), evidence: need(c, 'evidence') }, dayOf())
        c.out({ ok: true }, () => 'scored')
      },
    },
    {
      path: ['study', 'add'],
      summary: 'log a topic that the owner studied, with its page in the wiki',
      usage: '[course] --topic <text> --page <path>',
      flags: { topic: { type: 'string', help: 'the topic' }, page: { type: 'string', help: 'the wiki page of the topic' } },
      run(c) {
        course(c).addStudy(need(c, 'topic'), need(c, 'page'), dayOf())
        c.out({ ok: true }, () => 'logged')
      },
    },
  ],
}
