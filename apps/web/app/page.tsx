import { board } from '../lib/desk.ts'

// each request reads the desk of NOOK_DESK, so one build serves every desk
export const dynamic = 'force-dynamic'

export default function Home() {
  const items = board()
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
