import { duration } from '@nook/engineering/format.ts'
import type { Share, Times } from '@nook/engineering/report/metrics.ts'

/** The words of the metrics on the pages, so the home and the Metrics page say a number the same way. */

export const NO_DATA = 'No data'

export const percent = (s: Share) => (s.whole ? `${Math.round((s.part / s.whole) * 100)}%` : NO_DATA)

export const median = (t: Times) => (t.median === null ? NO_DATA : duration(t.median))

/** The longest time with its item, such as `longest 3 h (SHOP-1)`; none with no data. */
export const longest = (t: Times) => (t.longest ? `longest ${duration(t.longest.ms)} (${t.longest.item})` : null)
