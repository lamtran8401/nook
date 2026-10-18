import { readItems } from '../lib/desk.ts'

// the spike renders at build time, so `next build` runs the read path under Node
export const dynamic = 'force-static'

export default function Home() {
  const items = readItems()
  return (
    <main>
      <p data-runtime>{'Bun' in globalThis ? 'bun' : `node ${process.version}`}</p>
      <ul>
        {items.map(item => (
          <li key={item.id} data-item={item.id}>
            {item.id} · {item.state} · {item.title}
          </li>
        ))}
      </ul>
    </main>
  )
}
