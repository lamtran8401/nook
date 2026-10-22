/** A block of code, a line number before each line, with its language on top. */
export function CodeBlock({ lang, text }: { lang?: string | undefined; text: string }) {
  return (
    <figure data-slot="code-block" className="m-0 overflow-hidden rounded-md bg-muted ring-1 ring-hairline">
      {lang ? <div className="border-b border-hairline px-3.5 py-1.5 font-mono text-[11.5px] text-muted-foreground">{lang}</div> : null}
      <pre className="m-0 overflow-x-auto py-3 font-mono text-[12.5px] leading-5 [counter-reset:ln]">
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
