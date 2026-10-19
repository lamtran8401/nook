import { describe, expect, test } from 'bun:test'
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'

const web = join(import.meta.dirname, '..')

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name)
    return entry.isDirectory() ? files(path) : [path]
  })
}

const sources = ['app', 'components', 'lib'].flatMap(dir => files(join(web, dir)))
// a class of the old Bench components or of the old CSS of the app: a word that starts bn- or nk-, as in className="bn-card"
const OLD_CLASS = /(?<![\w-])(?:bn|nk)-[a-z]/

describe('the web app is built from the kit of packages/ui', () => {
  test('it has no CSS file of its own', () => {
    expect(sources.filter(file => file.endsWith('.css')).map(file => relative(web, file))).toEqual([])
  })

  test('no component or page uses a class of the old Bench components or of the old app CSS', () => {
    const users = sources.filter(file => /\.tsx?$/.test(file) && OLD_CLASS.test(readFileSync(file, 'utf8'))).map(file => relative(web, file))
    expect(users).toEqual([])
  })
})
