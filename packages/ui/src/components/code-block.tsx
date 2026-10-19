/** A block of code, a line number before each line, with its language on top. */
export function CodeBlock({ lang, text }: { lang?: string | undefined; text: string }) {
  return (
    <figure data-slot="code-block" className="m-0 overflow-hidden rounded-md border border-border bg-muted">
      {lang ? <div className="border-b border-border px-4 py-2 font-mono text-xs text-muted-foreground">{lang}</div> : null}
      <pre className="m-0 overflow-x-auto py-4 font-mono text-sm leading-[22px] [counter-reset:ln]">
        <code>
          {text.replace(/\n$/, '').split('\n').map((line, i) => (
            <span key={i} className="relative block pr-4 pl-12 [counter-increment:ln] before:absolute before:-ml-9 before:w-6 before:text-right before:text-muted-foreground before:content-[counter(ln)]">
              {line}
              {'\n'}
            </span>
          ))}
        </code>
      </pre>
    </figure>
  )
}
