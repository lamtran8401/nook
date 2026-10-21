import type { ReactNode } from 'react'

import { uiKit } from '@nook/desk/ui-kit.ts'
import '@nook/ui/styles/globals.css'

import { pageStyles } from '@/lib/kit.ts'

export const dynamic = 'force-dynamic'

/** The frame of each page: the Bench kit, the v2 layer over it, and the Bench script that draws the diagrams. The desk layout holds the shell. */
export default function RootLayout({ children }: { children: ReactNode }) {
  const kit = uiKit()
  const [kitCss, layer] = pageStyles()
  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{ __html: kitCss }} />
        <style dangerouslySetInnerHTML={{ __html: layer }} />
      </head>
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        {children}
        <script dangerouslySetInnerHTML={{ __html: kit.js }} />
      </body>
    </html>
  )
}
