import type { ReactNode } from 'react'

/**
 * A card of lines under one head, as the home, the wiki and the search show them: the head names what the lines are
 * about, and links to it when `href` is given. `indent` sets the lines under the head, as the parts of one item.
 */
export function Group({ head, href, indent, children }: { head: ReactNode; href?: string | undefined; indent?: boolean; children: ReactNode }) {
  return (
    <div className="bn-card nk-group">
      {href ? <a className="nk-group__head" href={href}>{head}</a> : <div className="nk-group__head">{head}</div>}
      <ul className={indent ? 'nk-lines nk-lines--indent' : 'nk-lines'}>{children}</ul>
    </div>
  )
}

/** One line of a group: a mark on the left, the words, and an end such as a button or a tag. */
export function GroupLine({ mark, end, children }: { mark?: ReactNode; end?: ReactNode; children: ReactNode }) {
  return (
    <li className="nk-line">
      {mark ?? <span />}
      <div className="nk-line__words">{children}</div>
      {end ?? <span />}
    </li>
  )
}

/** The number of lines, in the head of a group. */
export const Count = ({ n }: { n: number }) => <span className="nk-group__count">{n}</span>
