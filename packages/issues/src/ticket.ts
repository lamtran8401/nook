/** A ticket as each stage reads it: `backlog/<KEY>/ticket.md`, with one heading for each part. */

export type Comment = { author: string; at: string; body: string }
/** A file of the ticket: kept in `attachments/`, or a link when it is too large to keep. */
export type TicketFile = { name: string; kept?: string; link?: string; size?: string }
/** The text of one use of the map, such as the acceptance criteria; null when the ticket does not have it. */
export type Section = { use: string; text: string | null }
export type Ticket = {
  key: string
  title: string
  link: string
  fields: [name: string, value: string][]
  description: string
  sections: Section[]
  comments: Comment[]
  files?: TicketFile[]
}

const CRITERIA = 'acceptanceCriteria'
const NONE = 'None in the ticket.'

/** The heading of a use: `technicalSolution` reads as Technical solution. */
export function headingOf(use: string): string {
  if (use === CRITERIA) return 'Acceptance criteria'
  const words = use.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/** Each heading of the words two levels lower, outside a code fence, so it stays under the heading of its part. */
function demote(text: string): string {
  let fence = false
  return text
    .split('\n')
    .map(line => {
      if (/^\s*(```|~~~)/.test(line)) fence = !fence
      return !fence && /^#{1,4} /.test(line) ? `##${line}` : line
    })
    .join('\n')
}

const part = (heading: string, body: string) => `## ${heading}\n${body}`
const file = (f: TicketFile) => (f.kept ? `- ${f.name}: ${f.kept}` : `- ${f.name} (${f.size}, too large to keep): ${f.link}`)
const comment = (c: Comment) => `- ${c.author} on ${c.at}:\n${c.body.split('\n').map(line => `  ${line}`).join('\n')}`

export function renderTicket(ticket: Ticket): string {
  const criteria = ticket.sections.find(s => s.use === CRITERIA)?.text
  const others = ticket.sections.filter(s => s.use !== CRITERIA)
  return `${[
    `# ${ticket.key}: ${ticket.title}`,
    part('Fields', ticket.fields.map(([name, value]) => `- ${name}: ${value}`).join('\n')),
    part('Description', ticket.description.trim() ? demote(ticket.description.trim()) : NONE),
    part('Acceptance criteria', criteria ? demote(criteria) : `${NONE} /spec writes them with the owner.`),
    ...others.map(s => part(headingOf(s.use), s.text ? demote(s.text) : NONE)),
    part('Comments', ticket.comments.length ? ticket.comments.map(comment).join('\n') : 'None.'),
    ...(ticket.files?.length ? [part('Attachments', ticket.files.map(file).join('\n'))] : []),
  ].join('\n\n')}\n`
}

/** The parts of a ticket file by their heading, as a pull compares them. */
export function sectionsOf(text: string): Record<string, string> {
  const parts: Record<string, string> = {}
  let heading: string | null = null
  let lines: string[] = []
  const close = () => {
    if (heading !== null) parts[heading] = lines.join('\n').trim()
  }
  for (const line of text.split('\n')) {
    const found = /^## (.+)$/.exec(line)
    if (!found) {
      lines.push(line)
      continue
    }
    close()
    heading = found[1]!.trim()
    lines = []
  }
  close()
  return parts
}
