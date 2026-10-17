/** The command of the tool. An agent runs it by this name only, so the guards can see each call. */
export const TOOL = 'nook'

/** An old short form that is not the tool: the guards block it, so an alias of the owner never runs as an agent. */
export const SHORT_NAME = 'nk'

/** The tool or the old short form, as a part of a regular expression. */
export const ANY_NAME = '(?:nook|nk)'

/** The variables that set the role of a call. */
export const ROLE_VAR = 'NOOK_(?:ROLE|ACTOR|SESSION)'
