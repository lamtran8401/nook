import { redirect } from 'next/navigation'

import { listDesks } from '@/lib/desks.ts'

export const dynamic = 'force-dynamic'

/** The address of the app goes to the desk where `nook web` started. */
export default function Root() {
  redirect(`/${listDesks()[0]!.slug}`)
}
