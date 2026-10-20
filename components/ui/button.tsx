import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Carbon-Button: eckig, Beschriftung links, Symbol rechts, Fokus als
 * blauer Rahmen mit weisser Innenkante.
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-between gap-4 border border-transparent text-sm font-normal whitespace-nowrap transition-colors duration-[70ms] outline-none select-none focus-visible:border-ring focus-visible:shadow-[inset_0_0_0_1px_var(--ring),inset_0_0_0_2px_var(--background)] disabled:pointer-events-none disabled:border-transparent disabled:bg-[#c6c6c6] disabled:text-[#8d8d8d] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary-hover active:bg-[#6f6f6f]",
        outline:
          "border-primary bg-transparent text-primary hover:bg-primary-hover hover:text-primary-foreground active:bg-primary-active disabled:bg-transparent disabled:border-[#c6c6c6]",
        ghost:
          "bg-transparent text-primary hover:bg-layer-hover active:bg-layer-selected disabled:bg-transparent",
        destructive: "bg-destructive text-white hover:bg-[#b81921] active:bg-[#750e13]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4",
        xs: "h-6 gap-2 px-2 text-xs",
        sm: "h-8 gap-3 px-3",
        lg: "h-12 min-w-40 px-4",
        icon: "size-10 justify-center",
        "icon-xs": "size-6 justify-center",
        "icon-sm": "size-8 justify-center",
        "icon-lg": "size-12 justify-center",
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
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
