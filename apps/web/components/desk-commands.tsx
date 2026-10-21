'use client'

import { useRouter } from 'next/navigation'
import { useMemo } from 'react'

import { CommandMenu } from '@nook/ui/components/command-menu.tsx'

import { Move } from '@/components/item/move.tsx'
import { usePaired } from '@/components/owner.tsx'
import { type CommandData, deskCommands, searchCommand } from '@/lib/commands.ts'

const moveId = (move: string, item: string) => `command-move-${move}-${item}`

/**
 * The ⌘K menu of a desk. A move runs the same form as the button on the page: a form for each move that waits, with
 * its button hidden, so the menu asks first through that form and goes through the gate. A refusal shows at the
 * bottom right, where the forms sit.
 */
export function DeskCommands({ data }: { data: CommandData }) {
  const router = useRouter()
  const paired = usePaired()
  const commands = useMemo(
    () =>
      deskCommands(data, paired, {
        go: href => router.push(href),
        move: (move, item) => document.querySelector<HTMLFormElement>(`#${moveId(move, item)} form`)?.requestSubmit(),
      }),
    [data, paired, router],
  )
  return (
    <>
      <CommandMenu commands={commands} extra={words => [searchCommand(data.base, words, href => router.push(href))]} />
      {paired ? (
        <div className="pointer-events-none fixed right-4 bottom-4 z-[55] grid w-[min(420px,calc(100%-32px))] gap-2 [&_[role=alert]]:pointer-events-auto">
          {data.moves.map(m => (
            <div key={moveId(m.move, m.item)} id={moveId(m.move, m.item)}>
              <Move fields={{ kind: 'gate', move: m.move, item: m.item }}>
                <button type="submit" hidden tabIndex={-1} />
              </Move>
            </div>
          ))}
        </div>
      ) : null}
    </>
  )
}
