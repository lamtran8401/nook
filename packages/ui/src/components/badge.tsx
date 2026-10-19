import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@nook/ui/lib/utils.ts"

/** The badge of the kit: a short word in a tone, such as a state, a kind, an area or a count. */
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1 overflow-hidden whitespace-nowrap focus-visible:ring-[3px] focus-visible:ring-ring/50 [&>svg]:pointer-events-none",
  {
    variants: {
      variant: {
        soft: "h-5 rounded-full bg-tone-subtle px-2 text-xs font-semibold text-tone",
        solid: "h-5 min-w-5 justify-center rounded-full bg-tone px-1.5 text-[10px] font-bold tracking-wide text-surface",
        outline: "h-5 rounded-full px-2 text-xs font-semibold text-muted-foreground ring-1 ring-border ring-inset",
        label: "rounded-[4px] bg-tone/12 px-1.5 text-[10.5px] leading-4 font-bold tracking-wide text-tone uppercase",
      },
    },
    defaultVariants: {
      variant: "soft",
    },
  }
)

function Badge({
  className,
  variant = "soft",
  tone = "neutral",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { tone?: string; asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-tone={tone}
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
