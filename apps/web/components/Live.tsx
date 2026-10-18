'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/** Listens on /live and renders the page again when the desk changes, with no reload. */
export function Live() {
  const router = useRouter()
  useEffect(() => {
    const source = new EventSource('/live')
    source.addEventListener('change', () => router.refresh())
    return () => source.close()
  }, [router])
  return null
}
