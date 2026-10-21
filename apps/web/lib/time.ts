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

/** A time in its two largest units: `1d 5h`, `3h 20m` or `12m`. */
export function duration(ms: number): string {
  const minutes = Math.max(0, Math.round(ms / 60_000))
  if (minutes >= 1440) return `${Math.floor(minutes / 1440)}d ${Math.floor((minutes % 1440) / 60)}h`
  if (minutes >= 60) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
  return `${minutes}m`
}

/** The time from `from` to `to`, such as `1d 5h`. */
export const span = (from: string, to: Date): string => duration(to.getTime() - Date.parse(from))
