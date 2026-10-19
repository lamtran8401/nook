'use client'

import { useState } from 'react'

type Copy = 'idle' | 'copied' | 'failed'
const COPY_TITLE: Record<Copy, string> = { idle: 'Copy', copied: 'Copied', failed: 'The copy failed: select the text' }

/** A command to type, as code with a button that copies it. */
export function Cmd({ text }: { text: string }) {
  const [copy, setCopy] = useState<Copy>('idle')
  const write = () =>
    navigator.clipboard.writeText(text).then(
      () => setCopy('copied'),
      () => setCopy('failed'),
    )
  return (
    <code className="nk-cmd">
      {text}
      <button type="button" className="nk-cmd__copy" aria-label="Copy the command" title={COPY_TITLE[copy]} data-copy={copy} onClick={() => void write()} onBlur={() => setCopy('idle')}>
        <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
          <path d={copy === 'copied' ? 'M2.5 6.5l2.2 2.2 4.8-5' : 'M4 4h6.5v6.5H4zM8 2H2v6'} fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </code>
  )
}
