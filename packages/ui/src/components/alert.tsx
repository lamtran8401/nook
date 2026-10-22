import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@nook/ui/lib/utils.ts"

/** The alert of the kit: a note in one tone, with an optional mark of the tone before its title. */
const alertVariants = cva(
  "relative grid w-full grid-cols-[0_1fr] items-start gap-y-0.5 rounded-md px-3.5 py-3 text-[13.5px] has-[>[data-slot=alert-mark]]:grid-cols-[24px_1fr] has-[>[data-slot=alert-mark]]:gap-x-3",
  {
    variants: {
      variant: {
        soft: "bg-tone-subtle ring-1 ring-tone/20 ring-inset",
        plain: "bg-card shadow-sm",
      },
    },
    defaultVariants: {
      variant: "soft",
    },
  }
)

function Alert({
  className,
  variant,
  tone = "neutral",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants> & { tone?: string }) {
  return (
    <div
      data-slot="alert"
      data-tone={tone}
      role="note"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

/** The mark of the tone before the title, such as i or !. */
function AlertMark({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="alert-mark"
      aria-hidden="true"
      className={cn("row-span-2 grid size-6 place-items-center rounded-sm bg-tone text-xs font-bold text-surface [&_svg]:size-3.5", className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "col-start-2 min-h-4 font-semibold text-foreground",
        className
      )}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "col-start-2 text-[13.5px] leading-[21px] text-foreground [&>*+*]:mt-2",
        className
      )}
      {...props}
    />
  )
}

export { Alert, AlertMark, AlertTitle, AlertDescription }
