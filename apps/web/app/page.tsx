import { redirect } from 'next/navigation'

import { listWorkspaces } from '@/lib/workspaces.ts'

export const dynamic = 'force-dynamic'

/** The address of the app goes to the workspace where `nook web` started. */
export default function Root() {
  redirect(`/${listWorkspaces()[0]!.slug}`)
}
