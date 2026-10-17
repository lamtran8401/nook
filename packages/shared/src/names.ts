/** The command of the tool. An agent runs it by this name only, so the guards can see each call. */
export const TOOL = 'nook'

/** Other names that run the tool: `nk` is the owner's short form; `kit` and `kit-eng` are the names before nook. */
export const OTHER_NAMES: readonly string[] = ['nk', 'kit', 'kit-eng']

/** Any name of the tool, as a part of a regular expression. */
export const ANY_NAME = '(?:nook|nk|kit-eng|kit)'

/** The variables that set the role of a call, also under the old prefix. */
export const ROLE_VAR = '(?:NOOK|KIT)_(?:ROLE|ACTOR|SESSION)'

/** The state folders of an environment: the current one first, then the one before the rename. */
export const STATE_DIRS: readonly string[] = ['.nook', '.kit']
