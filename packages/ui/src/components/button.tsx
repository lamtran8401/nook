import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@nook/ui/lib/utils.ts"
import { Slot } from "radix-ui"

const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-[7px] rounded-full text-[13px] font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // the main action is ink, with a light top edge; colour is kept for the states
        default:
          "bg-foreground text-background shadow-[inset_0_1px_0_oklch(1_0_0/0.22),0_1px_2px_oklch(0.2_0.01_260/0.2),0_4px_10px_-3px_oklch(0.2_0.01_260/0.3)] hover:bg-foreground/90 [&_[data-slot=kbd]]:bg-transparent [&_[data-slot=kbd]]:text-current [&_[data-slot=kbd]]:opacity-70 [&_[data-slot=kbd]]:shadow-[inset_0_0_0_1px_currentColor]",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
        outline: "bg-surface text-foreground shadow-xs hover:bg-muted",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-[30px] px-3.5 has-[>svg]:px-3",
        xs: "h-6 gap-1 px-2.5 text-xs has-[>svg]:px-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-[26px] gap-1.5 px-2.5 text-[12.5px] has-[>svg]:px-2",
        lg: "h-9 px-5 has-[>svg]:px-4",
        icon: "size-[30px]",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-[26px]",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
