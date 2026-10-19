import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** The classes of a part joined, a later Tailwind class winning over an earlier one of the same kind. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
