'use client'

import { Check, Copy } from 'lucide-react'
import { useState } from 'react'

type Copied = 'idle' | 'copied' | 'failed'
const TITLE: Record<Copied, string> = { idle: 'Copy', copied: 'Copied', failed: 'The copy failed: select the text' }

/** A command to type, as code with a button that copies it. */
export function CopyCommand({ text }: { text: string }) {
  const [copied, setCopied] = useState<Copied>('idle')
  const write = () =>
    navigator.clipboard.writeText(text).then(
      () => setCopied('copied'),
      () => setCopied('failed'),
    )
  return (
    <code data-slot="copy-command" className="inline-flex max-w-full items-center gap-1 rounded-[6px] bg-muted py-0.5 pr-0.5 pl-2 font-mono text-xs leading-[18px] text-foreground ring-1 ring-hairline ring-inset [overflow-wrap:anywhere]">
      {text}
      <button
        type="button"
        aria-label="Copy the command"
        title={TITLE[copied]}
        data-copied={copied}
        onClick={() => void write()}
        onBlur={() => setCopied('idle')}
        className="grid size-5 shrink-0 cursor-pointer place-items-center rounded-[4px] text-muted-foreground hover:bg-surface hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring data-[copied=copied]:text-success data-[copied=failed]:text-danger"
      >
        {copied === 'copied' ? <Check className="size-3" aria-hidden="true" /> : <Copy className="size-3" aria-hidden="true" />}
      </button>
    </code>
  )
}
