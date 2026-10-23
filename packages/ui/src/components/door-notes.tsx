import { CircleAlert } from 'lucide-react'

export type DoorNote = { text: string; fix?: string }

/** The notes of a door: what the one who moves the item should know, each with its fix. They inform; they never hold the move. */
export function DoorNotes({ notes }: { notes: DoorNote[] }) {
  if (!notes.length) return null
  return (
    <ul data-slot="door-notes" className="grid gap-1">
      {notes.map(note => (
        <li key={note.text} className="grid grid-cols-[16px_minmax(0,1fr)] items-start gap-2 text-[12.5px]">
          <CircleAlert className="mt-px size-3.5 text-warning" aria-hidden="true" />
          <span className="min-w-0">
            <span className="font-medium text-foreground">{note.text}</span>
            {note.fix ? <span className="text-muted-foreground"> {note.fix}</span> : null}
          </span>
        </li>
      ))}
    </ul>
  )
}
