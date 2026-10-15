import { basename, relative, resolve, sep } from 'node:path'

import { secretsAbove } from '@kit/env/env.ts'

const SECRET_NAMES = [/^\.env(\..+)?$/, /^\.npmrc$/]
const SECRET_DIRS = ['.ssh', '.aws']

/** The secret files of the kit: `.env` files except `.env.example`, `.npmrc`, `~/.ssh`, `~/.aws`, and the `secrets` of kit.yml. */
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
    if (/^[~./\w-]*\/?\.env(\..+)?$/.test(word) && !word.endsWith('.env.example')) return `the command names ${word}: the kit does not read or write secrets.`
    if (/(^|\/)\.npmrc$/.test(word) || /(^|\/)\.(ssh|aws)(\/|$)/.test(word)) return `the command touches ${word}: the kit does not read secrets.`
    if (/(^|\/)\.kit\/.*\.db/.test(word) || /^sqlite3?$/.test(word)) return 'the state databases of the kit are not for the shell: use the kit tools.'
    return null
  }

  /** A secret of kit.yml that the command names, by its full or its relative path, or null. */
  listedIn(plain: string): string | null {
    for (const secret of this.listed) {
      const rel = relative(this.cwd, secret)
      if (plain.includes(secret) || (rel && !rel.startsWith('..') && plain.includes(rel))) return rel || secret
    }
    return null
  }
}
