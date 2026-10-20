'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/** Listens on the live stream of the desk at `base` and renders the page again when the desk changes, with no reload. */
export function Live({ base }: { base: string }) {
  const router = useRouter()
  useEffect(() => {
    const source = new EventSource(`${base}/live`)
    source.addEventListener('change', () => router.refresh())
    return () => source.close()
  }, [router, base])
  return null
}
