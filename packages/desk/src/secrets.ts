import { basename, relative, resolve, sep } from 'node:path'

import { secretsAbove } from './desks.ts'

const ENV_FILE = /^(?:\.env(?:\..+)?|[\w-][\w.-]*\.env)$/
const CODE_ENV = /^(?:process|Bun|Deno|import\.meta)\.env$/
// the folders of keys and logins: ssh and aws, and the logins of the trackers twg and gh
const SECRET_DIR = /(^|\/)(?:\.ssh|\.aws|\.config\/(?:twg|gh))(\/|$)/

/** `.env`, `.env.local`, `prod.env`; not `.env.example`. */
const isEnvFile = (name: string): boolean => ENV_FILE.test(name) && !name.endsWith('.env.example')

/** In a command, `process.env` is code, not a file; `$HOME/.env` and `--env-file=.env` name the file. */
const namesEnvFile = (word: string): boolean => {
  const name = basename(word.split('=').at(-1) ?? '')
  return isEnvFile(name) && !CODE_ENV.test(name)
}

/** The secret files: env files except `.env.example`, `.npmrc`, `~/.ssh`, `~/.aws`, `~/.config/twg`, `~/.config/gh`, and the `secrets` of nook.yml. */
export class SecretPolicy {
  private readonly listed: string[]

  constructor(private readonly cwd: string) {
    this.listed = secretsAbove(cwd)
  }

  isSecretPath(path: string): boolean {
    const name = basename(path)
    if (isEnvFile(name) || name === '.npmrc') return true
    const full = resolve(this.cwd, path.replace(/^~(?=\/|$)/, process.env.HOME ?? '~'))
    if (SECRET_DIR.test(full.split(sep).join('/'))) return true
    return this.listed.some(secret => full === secret || full.startsWith(`${secret}${sep}`))
  }

  wordProblem(word: string): string | null {
    if (namesEnvFile(word)) return `the command names ${word}: Nook does not read or write secrets.`
    if (/(^|\/)\.npmrc$/.test(word) || SECRET_DIR.test(word)) return `the command touches ${word}: Nook does not read secrets.`
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
