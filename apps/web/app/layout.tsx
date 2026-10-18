import { basename } from 'node:path'

import type { ReactNode } from 'react'

import { uiKit } from '@nook/desk/ui-kit.ts'

import { PackNav } from '../components/PackNav.tsx'
import { deskDir, packTabs } from '../lib/desk.ts'
import './app.css'

export const dynamic = 'force-dynamic'

/** The shell of each page: the Bench tokens and styles, the desk name and the pack tabs; the Bench script draws the diagrams. */
export default function RootLayout({ children }: { children: ReactNode }) {
  const desk = deskDir()
  const kit = uiKit()
  return (
    <html lang="en">
      <head>
        <title>{`Nook · ${basename(desk)}`}</title>
        <style dangerouslySetInnerHTML={{ __html: kit.css }} />
      </head>
      <body className="bn-root">
        <header className="nk-top">
          <span className="nk-top__desk">{basename(desk)}</span>
          <PackNav tabs={packTabs(desk)} />
        </header>
        <main className="nk-main">{children}</main>
        <script dangerouslySetInnerHTML={{ __html: kit.js }} />
      </body>
    </html>
  )
}
