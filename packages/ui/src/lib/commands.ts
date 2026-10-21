/** One command of the menu: a move, an item, a page or a desk. `keys` is its key sequence, such as G then B. */
export type Command = { id: string; group: string; label: string; sub?: string; tone?: string; keys?: string[]; run: () => void }

/** The commands whose label or note holds the words, in their order; no words keep them all. */
export function visibleCommands(commands: Command[], words: string): Command[] {
  const query = words.trim().toLowerCase()
  if (!query) return commands
  return commands.filter(command => `${command.label} ${command.sub ?? ''}`.toLowerCase().includes(query))
}

/** The commands by group, the groups in the order of their first command, such as the moves that wait first. */
export function groupsOf(commands: Command[]): [group: string, commands: Command[]][] {
  const groups = new Map<string, Command[]>()
  for (const command of commands) groups.set(command.group, [...(groups.get(command.group) ?? []), command])
  return [...groups]
}

/** A key pressed outside a field: the command whose sequence it ends, or the keys that still wait for the next one. */
export function pressKey(pending: string[], key: string, commands: Command[]): { pending: string[]; command?: Command } {
  const typed = [...pending, key.toLowerCase()]
  const done = commands.find(command => command.keys?.join(' ') === typed.join(' '))
  if (done) return { pending: [], command: done }
  const starts = commands.some(command => command.keys && command.keys.length > typed.length && typed.every((k, i) => command.keys![i] === k))
  return { pending: starts ? typed : [] }
}
