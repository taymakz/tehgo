"use client"

import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import type React from "react"
import { cn } from "@workspace/ui/lib/utils"

export const badgeVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center gap-1 rounded-sm border border-transparent font-medium whitespace-nowrap transition-shadow outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-64 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='opacity-'])]:opacity-80 [&_svg:not([class*='size-'])]:size-3.5 sm:[&_svg:not([class*='size-'])]:size-3 [button&,a&]:cursor-pointer [button&,a&]:pointer-coarse:after:absolute [button&,a&]:pointer-coarse:after:size-full [button&,a&]:pointer-coarse:after:min-h-11 [button&,a&]:pointer-coarse:after:min-w-11",
  {
    defaultVariants: {
      size: "default",
      variant: "default",
    },
    variants: {
      size: {
        default:
          "h-5.5 min-w-5.5 px-[calc(--spacing(1)-1px)] text-sm sm:h-4.5 sm:min-w-4.5 sm:text-xs",
        lg: "h-6.5 min-w-6.5 px-[calc(--spacing(1.5)-1px)] text-base sm:h-5.5 sm:min-w-5.5 sm:text-sm",
        sm: "h-5 min-w-5 rounded-[.25rem] px-[calc(--spacing(1)-1px)] text-xs sm:h-4 sm:min-w-4 sm:text-[.625rem]",
      },
      variant: {
        default:
          "bg-primary text-primary-foreground [button&,a&]:hover:bg-primary/90",
        destructive:
          "bg-destructive text-white [button&,a&]:hover:bg-destructive/90",
        "destructive-subtle":
          "bg-destructive/8 text-destructive dark:bg-destructive/16",
        info: "bg-info/8 text-info-foreground dark:bg-info/16",
        outline:
          "border-input bg-background text-foreground dark:bg-input/32 [button&,a&]:hover:bg-accent/50 dark:[button&,a&]:hover:bg-input/48",
        secondary:
          "bg-secondary text-secondary-foreground [button&,a&]:hover:bg-secondary/90",
        success: "bg-success/8 text-success-foreground dark:bg-success/16",
        warning: "bg-warning/8 text-warning-foreground dark:bg-warning/16",
        slate:
          "border-slate-500/30 bg-slate-500/20 text-slate-800 dark:bg-slate-400/20 dark:text-slate-100",
        gray: "border-gray-500/30 bg-gray-500/20 text-gray-800 dark:bg-gray-400/20 dark:text-gray-100",
        zinc: "border-zinc-500/30 bg-zinc-500/20 text-zinc-800 dark:bg-zinc-400/20 dark:text-zinc-100",
        neutral:
          "border-neutral-500/30 bg-neutral-500/20 text-neutral-800 dark:bg-neutral-400/20 dark:text-neutral-100",
        stone:
          "border-stone-500/30 bg-stone-500/20 text-stone-800 dark:bg-stone-400/20 dark:text-stone-100",

        red: "border-red-500/30 bg-red-500/20 text-red-800 dark:bg-red-400/20 dark:text-red-100",
        orange:
          "border-orange-500/30 bg-orange-500/20 text-orange-800 dark:bg-orange-400/20 dark:text-orange-100",
        amber:
          "border-amber-500/30 bg-amber-500/20 text-amber-800 dark:bg-amber-400/20 dark:text-amber-100",
        yellow:
          "border-yellow-500/30 bg-yellow-500/20 text-yellow-800 dark:bg-yellow-400/20 dark:text-yellow-100",
        lime: "border-lime-500/30 bg-lime-500/20 text-lime-800 dark:bg-lime-400/20 dark:text-lime-100",
        green:
          "border-green-500/30 bg-green-500/20 text-green-800 dark:bg-green-400/20 dark:text-green-100",
        emerald:
          "border-emerald-500/30 bg-emerald-500/20 text-emerald-800 dark:bg-emerald-400/20 dark:text-emerald-100",
        teal: "border-teal-500/30 bg-teal-500/20 text-teal-800 dark:bg-teal-400/20 dark:text-teal-100",
        cyan: "border-cyan-500/30 bg-cyan-500/20 text-cyan-800 dark:bg-cyan-400/20 dark:text-cyan-100",
        sky: "border-sky-500/30 bg-sky-500/20 text-sky-800 dark:bg-sky-400/20 dark:text-sky-100",
        blue: "border-blue-500/30 bg-blue-500/20 text-blue-800 dark:bg-blue-400/20 dark:text-blue-100",
        indigo:
          "border-indigo-500/30 bg-indigo-500/20 text-indigo-800 dark:bg-indigo-400/20 dark:text-indigo-100",
        violet:
          "border-violet-500/30 bg-violet-500/20 text-violet-800 dark:bg-violet-400/20 dark:text-violet-100",
        purple:
          "border-purple-500/30 bg-purple-500/20 text-purple-800 dark:bg-purple-400/20 dark:text-purple-100",
        fuchsia:
          "border-fuchsia-500/30 bg-fuchsia-500/20 text-fuchsia-800 dark:bg-fuchsia-400/20 dark:text-fuchsia-100",
        pink: "border-pink-500/30 bg-pink-500/20 text-pink-800 dark:bg-pink-400/20 dark:text-pink-100",
        rose: "border-rose-500/30 bg-rose-500/20 text-rose-800 dark:bg-rose-400/20 dark:text-rose-100",

        // Subtle color variants — lighter tint, colored foreground (bg-500/15 · text-500).
        "orange-subtle":
          "bg-orange-500/15 text-orange-600 dark:bg-orange-400/15 dark:text-orange-400",
        "amber-subtle":
          "bg-amber-500/15 text-amber-600 dark:bg-amber-400/15 dark:text-amber-400",
        "yellow-subtle":
          "bg-yellow-500/15 text-yellow-600 dark:bg-yellow-400/15 dark:text-yellow-400",
        "lime-subtle":
          "bg-lime-500/15 text-lime-600 dark:bg-lime-400/15 dark:text-lime-400",
        "green-subtle":
          "bg-green-500/15 text-green-600 dark:bg-green-400/15 dark:text-green-400",
        "emerald-subtle":
          "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-400",
        "teal-subtle":
          "bg-teal-500/15 text-teal-600 dark:bg-teal-400/15 dark:text-teal-400",
        "cyan-subtle":
          "bg-cyan-500/15 text-cyan-600 dark:bg-cyan-400/15 dark:text-cyan-400",
        "sky-subtle":
          "bg-sky-500/15 text-sky-600 dark:bg-sky-400/15 dark:text-sky-400",
        "blue-subtle":
          "bg-blue-500/15 text-blue-600 dark:bg-blue-400/15 dark:text-blue-400",
        "indigo-subtle":
          "bg-indigo-500/15 text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-400",
        "violet-subtle":
          "bg-violet-500/15 text-violet-600 dark:bg-violet-400/15 dark:text-violet-400",
        "purple-subtle":
          "bg-purple-500/15 text-purple-600 dark:bg-purple-400/15 dark:text-purple-400",
        "fuchsia-subtle":
          "bg-fuchsia-500/15 text-fuchsia-600 dark:bg-fuchsia-400/15 dark:text-fuchsia-400",
        "pink-subtle":
          "bg-pink-500/15 text-pink-600 dark:bg-pink-400/15 dark:text-pink-400",
        "rose-subtle":
          "bg-rose-500/15 text-rose-600 dark:bg-rose-400/15 dark:text-rose-400",
        "red-subtle":
          "bg-red-500/15 text-red-600 dark:bg-red-400/15 dark:text-red-400",
      },
    },
  }
)

export interface BadgeProps extends useRender.ComponentProps<"span"> {
  variant?: VariantProps<typeof badgeVariants>["variant"]
  size?: VariantProps<typeof badgeVariants>["size"]
}

export function Badge({
  className,
  variant,
  size,
  render,
  ...props
}: BadgeProps): React.ReactElement {
  const defaultProps = {
    className: cn(badgeVariants({ className, size, variant })),
    "data-slot": "badge",
  }

  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(defaultProps, props),
    render,
  })
}
