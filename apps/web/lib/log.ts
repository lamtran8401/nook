/** The lines of the terminal of `nook web`, in the format of Next.js. Node runs this file with no bundler. */

const paint = (code: number, text: string, color: boolean) => (color ? `\u001b[${code}m${text}\u001b[39m` : text)
const bold = (text: string, color: boolean) => (color ? `\u001b[1m${text}\u001b[22m` : text)
const GREEN = 32
const YELLOW = 33
const RED = 31
const MAGENTA = 35

export function banner(options: { version: string; url: string; workspaces: string[]; color: boolean }): string {
  const { version, url, workspaces, color } = options
  return [`   ${paint(MAGENTA, bold(`▲ Next.js ${version}`, color), color)}`, `   - Local:   ${url}`, `   - Workspaces:   ${workspaces.join(', ')}`, ''].join('\n')
}

export const readyLine = (ms: number, color: boolean) => ` ${paint(GREEN, '✓', color)} Ready in ${Math.round(ms)}ms`

const statusColor = (status: number) => (status >= 500 ? RED : status >= 400 ? YELLOW : GREEN)

/** One request: the query string is left out, so a pair token never reaches the terminal. */
export function requestLine(options: { method: string; url: string; status: number; ms: number; color: boolean }): string {
  const { method, url, status, ms, color } = options
  const path = url.split('?')[0]
  return ` ${bold(method, color)} ${path} ${paint(statusColor(status), String(status), color)} in ${Math.round(ms)}ms`
}
