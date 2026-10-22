import { duration } from '@nook/engineering/format.ts'

// the formats are made at each call, so they follow the time zone of the machine that renders, also when it changes
const pad = (n: number) => String(n).padStart(2, '0')

/** `14 Oct` */
export const day = (at: string) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(new Date(at))

/** `09:10` */
export const clock = (at: string) => {
  const d = new Date(at)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** `Wednesday 15 Oct`, the heading of a day in a timeline. */
export const dayHeading = (at: string) => new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }).format(new Date(at))

/** The time from `from` to `to`, such as `1 d 5 h`. */
export const span = (from: string, to: Date): string => duration(Math.max(0, to.getTime() - Date.parse(from)))
