'use client'

import { Search } from 'lucide-react'
import { Dialog as MenuPrimitive } from 'radix-ui'
import { useEffect, useRef, useState } from 'react'

import { Kbd } from '@nook/ui/components/kbd.tsx'
import { type Command, groupsOf, pressKey, visibleCommands } from '@nook/ui/lib/commands.ts'
import { cn } from '@nook/ui/lib/utils.ts'

const OPEN_EVENT = 'nook:command-menu'
const SEQUENCE_MS = 900

/** Opens the command menu from a part outside it, such as the search button of the sidebar. */
export const openCommandMenu = () => window.dispatchEvent(new Event(OPEN_EVENT))

const typing = (target: EventTarget | null) => target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))

/**
 * The menu of ⌘K: the commands by group, filtered by the words typed, run with Enter. It also runs the key sequence of
 * a command while it is closed, such as G then B, when no field has the focus. `extra` adds commands for the words,
 * such as a search of the desk.
 */
export function CommandMenu({ commands, extra = () => [] }: { commands: Command[]; extra?: (words: string) => Command[] }) {
  const [open, setOpen] = useState(false)
  const [words, setWords] = useState('')
  const [at, setAt] = useState(0)
  const pending = useRef<{ keys: string[]; at: number }>({ keys: [], at: 0 })
  const shown = [...visibleCommands(commands, words), ...(words.trim() ? extra(words.trim()) : [])]

  useEffect(() => {
    const show = () => setOpen(true)
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen(was => !was)
        return
      }
      if (event.metaKey || event.ctrlKey || event.altKey || typing(event.target) || document.querySelector('[role=dialog]')) return
      const since = Date.now() - pending.current.at
      const result = pressKey(since < SEQUENCE_MS ? pending.current.keys : [], event.key, commands)
      pending.current = { keys: result.pending, at: Date.now() }
      result.command?.run()
    }
    window.addEventListener(OPEN_EVENT, show)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener(OPEN_EVENT, show)
      window.removeEventListener('keydown', onKey)
    }
  }, [commands])

  const close = (next: boolean) => {
    setOpen(next)
    if (!next) {
      setWords('')
      setAt(0)
    }
  }
  const run = (command: Command | undefined) => {
    if (!command) return
    close(false)
    command.run()
  }
  const move = (step: number) => setAt(i => (shown.length ? (i + step + shown.length) % shown.length : 0))

  return (
    <MenuPrimitive.Root open={open} onOpenChange={close}>
      <MenuPrimitive.Portal>
        <MenuPrimitive.Overlay className="fixed inset-0 z-50 bg-[var(--scrim)] backdrop-blur-[2px]" />
        <MenuPrimitive.Content
          data-slot="command-menu"
          aria-describedby={undefined}
          className="fixed top-[14vh] left-1/2 z-50 w-[min(620px,calc(100%-32px))] -translate-x-1/2 overflow-hidden rounded-[14px] bg-[var(--glass-strong)] shadow-lg backdrop-blur-xl backdrop-saturate-150 outline-none"
          onKeyDown={event => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault()
              move(event.key === 'ArrowDown' ? 1 : -1)
            }
            if (event.key === 'Enter') {
              event.preventDefault()
              run(shown[at])
            }
          }}
        >
          <MenuPrimitive.Title className="sr-only">Search or run</MenuPrimitive.Title>
          <div className="flex items-center gap-2.5 border-b border-[var(--hairline)] px-4 py-3.5">
            <Search className="size-4 text-muted-foreground" aria-hidden="true" />
            <input
              autoFocus
              value={words}
              onChange={event => {
                setWords(event.target.value)
                setAt(0)
              }}
              placeholder="Type an item, a page, a desk or a move"
              aria-label="Search or run"
              className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
            />
            <Kbd>Esc</Kbd>
          </div>
          <div className="max-h-[52vh] overflow-auto">
            {shown.length ? (
              groupsOf(shown).map(([group, list]) => (
                <div key={group} className="px-2 pt-2 pb-1">
                  <p className="px-2.5 py-1 text-[11.5px] font-semibold text-muted-foreground">{group}</p>
                  {list.map(command => {
                    const index = shown.indexOf(command)
                    return (
                      <button
                        key={command.id}
                        type="button"
                        data-slot="command"
                        aria-selected={index === at}
                        onMouseMove={() => setAt(index)}
                        onClick={() => run(command)}
                        className={cn(
                          'grid w-full grid-cols-[18px_minmax(0,1fr)_auto] items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-sm',
                          index === at && 'bg-primary-subtle shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--primary)_30%,transparent)]',
                        )}
                      >
                        {command.tone ? <span data-tone={command.tone} className="size-2 rounded-full bg-tone" /> : <span />}
                        <span className="truncate">
                          {command.label}
                          {command.sub ? <span className="ml-1.5 text-[12.5px] text-muted-foreground">{command.sub}</span> : null}
                        </span>
                        {command.keys ? <Kbd>{command.keys.join(' ').toUpperCase()}</Kbd> : <Kbd>↵</Kbd>}
                      </button>
                    )
                  })}
                </div>
              ))
            ) : (
              <p className="px-4 py-5 text-sm text-muted-foreground">Nothing matches. Try an item id, a page or a desk.</p>
            )}
          </div>
          <div className="flex flex-wrap gap-3.5 border-t border-[var(--hairline)] px-4 py-2.5 text-xs text-muted-foreground">
            <span>↑↓ move</span>
            <span>↵ run</span>
            <span>G then a letter: go to a page</span>
            <span className="ml-auto">Moves ask before they run</span>
          </div>
        </MenuPrimitive.Content>
      </MenuPrimitive.Portal>
    </MenuPrimitive.Root>
  )
}
