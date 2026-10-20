"use client"

import { Switch as SwitchPrimitive } from "@base-ui/react/switch"

import { cn } from "@/lib/utils"

function Switch({
  className,
  size = "default",
  ...props
}: SwitchPrimitive.Root.Props & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch relative inline-flex shrink-0 cursor-pointer items-center rounded-full transition-colors duration-[70ms] outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:shadow-[0_0_0_1px_var(--background),0_0_0_3px_var(--ring)] data-[size=default]:h-6 data-[size=default]:w-12 data-[size=sm]:h-4 data-[size=sm]:w-8 data-checked:bg-gut data-unchecked:bg-border-strong data-disabled:cursor-not-allowed data-disabled:bg-border-subtle",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block rounded-full bg-white ring-0 transition-transform duration-[70ms] group-data-[size=default]/switch:size-[18px] group-data-[size=sm]/switch:size-2.5 group-data-[size=default]/switch:data-unchecked:translate-x-[3px] group-data-[size=sm]/switch:data-unchecked:translate-x-[3px] group-data-[size=default]/switch:data-checked:translate-x-[27px] group-data-[size=sm]/switch:data-checked:translate-x-[19px]"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
