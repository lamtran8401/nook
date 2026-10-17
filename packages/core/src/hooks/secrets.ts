import { basename, relative, resolve, sep } from 'node:path'

import { secretsAbove } from '@nook/desk/desks.ts'

const SECRET_NAMES = [/^\.env(\..+)?$/, /^\.npmrc$/]
const SECRET_DIRS = ['.ssh', '.aws']

/** The secret files: `.env` files except `.env.example`, `.npmrc`, `~/.ssh`, `~/.aws`, and the `secrets` of nook.yml. */
export class SecretPolicy {
  private readonly listed: string[]

  constructor(private readonly cwd: string) {
    this.listed = secretsAbove(cwd)
  }

  isSecretPath(path: string): boolean {
    const name = basename(path)
    if (name === '.env.example') return false
    if (SECRET_NAMES.some(re => re.test(name))) return true
    const full = resolve(this.cwd, path.replace(/^~(?=\/|$)/, process.env.HOME ?? '~'))
    if (SECRET_DIRS.some(dir => full.split(sep).includes(dir))) return true
    return this.listed.some(secret => full === secret || full.startsWith(`${secret}${sep}`))
  }

  wordProblem(word: string): string | null {
    if (/^[~./\w-]*\/?\.env(\..+)?$/.test(word) && !word.endsWith('.env.example')) return `the command names ${word}: Nook does not read or write secrets.`
    if (/(^|\/)\.npmrc$/.test(word) || /(^|\/)\.(ssh|aws)(\/|$)/.test(word)) return `the command touches ${word}: Nook does not read secrets.`
    if (/(^|\/)\.(nook|kit)\/.*\.db/.test(word) || /^sqlite3?$/.test(word)) return 'the state databases are not for the shell: use the nook commands.'
    return null
  }

  /** A secret of nook.yml that the command names, by its full or its relative path, or null. */
  listedIn(plain: string): string | null {
    for (const secret of this.listed) {
      const rel = relative(this.cwd, secret)
      if (plain.includes(secret) || (rel && !rel.startsWith('..') && plain.includes(rel))) return rel || secret
    }
    return null
  }
}
