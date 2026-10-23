/** The nook.yml of a new workspace: the comments that say what goes where, and an empty section for each feature named. */
export function nookYaml(features: string[]): string {
  return [
    '# Nook: this folder is a workspace. The folders inside it get its features and its rules.',
    '# A feature is on where nook.yml has its section: engineering:, issue-tracker:, wiki:. /setup writes each one.',
    '# rules.off: base rules that you do not want written. secrets: files that no agent may read.',
    '# budget: lean or deep, how many agents a skill may start. guards.commands: allow, ask and deny lists, such as allow: [gh pr create].',
    ...features.map(name => `${name}: {}`),
    '',
  ].join('\n')
}

/** Adds an empty section for each feature that the file lacks. Every other byte of the file stays. */
export const addSections = (source: string, missing: string[]): string =>
  missing.length ? `${source.trimEnd()}\n${missing.map(name => `${name}: {}`).join('\n')}\n` : source
