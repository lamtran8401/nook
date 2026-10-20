import type { ReactNode } from 'react'

import { uiKit } from '@nook/desk/ui-kit.ts'
import '@nook/ui/styles/globals.css'

export const dynamic = 'force-dynamic'

/** The frame of each page: the Bench tokens and the Bench script that draws the diagrams. The desk layout holds the shell. */
export default function RootLayout({ children }: { children: ReactNode }) {
  const kit = uiKit()
  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{ __html: kit.css }} />
      </head>
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        {children}
        <script dangerouslySetInnerHTML={{ __html: kit.js }} />
      </body>
    </html>
  )
}
