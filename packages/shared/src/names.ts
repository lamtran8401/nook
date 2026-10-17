/** The command of the tool. An agent runs it by this name only, so the guards can see each call. */
export const TOOL = 'nook'

/** The short form of the tool for the owner. An agent never runs it. */
export const SHORT_NAME = 'nk'

/** Either name of the tool, as a part of a regular expression. */
export const ANY_NAME = '(?:nook|nk)'

/** The variables that set the role of a call. */
export const ROLE_VAR = 'NOOK_(?:ROLE|ACTOR|SESSION)'
