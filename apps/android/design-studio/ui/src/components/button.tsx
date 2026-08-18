"use client"

import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import type * as React from "react"
import { cn } from "@workspace/ui/lib/utils"
import { Spinner } from "@workspace/ui/components/spinner"

export const buttonVariants = cva(
  "relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border text-base font-medium whitespace-nowrap transition-[box-shadow,scale] duration-150 ease-out outline-none before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-lg)-1px)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-64 data-loading:text-transparent data-loading:select-none sm:text-sm pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 [&_svg]:pointer-events-none [&_svg]:-mx-0.5 [&_svg]:shrink-0 [&_svg:not([class*='opacity-'])]:opacity-80 [&_svg:not([class*='size-'])]:size-4.5 sm:[&_svg:not([class*='size-'])]:size-4",
  {
    defaultVariants: {
      size: "default",
      variant: "default",
    },
    variants: {
      size: {
        default: "h-9 px-[calc(--spacing(3)-1px)] sm:h-8",
        icon: "size-9 sm:size-8",
        "icon-lg": "size-10 sm:size-9",
        "icon-sm": "size-8 sm:size-7",
        "icon-xl":
          "size-11 sm:size-10 [&_svg:not([class*='size-'])]:size-5 sm:[&_svg:not([class*='size-'])]:size-4.5",
        "icon-xs":
          "size-7 rounded-md before:rounded-[calc(var(--radius-md)-1px)] sm:size-6 not-in-data-[slot=input-group]:[&_svg:not([class*='size-'])]:size-4 sm:not-in-data-[slot=input-group]:[&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 px-[calc(--spacing(3.5)-1px)] sm:h-9",
        sm: "h-8 gap-1.5 px-[calc(--spacing(2.5)-1px)] sm:h-7",
        xl: "h-11 px-[calc(--spacing(4)-1px)] text-lg sm:h-10 sm:text-base [&_svg:not([class*='size-'])]:size-5 sm:[&_svg:not([class*='size-'])]:size-4.5",
        xs: "h-7 gap-1 rounded-md px-[calc(--spacing(2)-1px)] text-sm before:rounded-[calc(var(--radius-md)-1px)] sm:h-6 sm:text-xs [&_svg:not([class*='size-'])]:size-4 sm:[&_svg:not([class*='size-'])]:size-3.5",
      },
      variant: {
        default:
          "border-primary bg-primary text-primary-foreground shadow-xs shadow-primary/24 not-disabled:inset-shadow-[0_1px_--theme(--color-white/16%)] hover:bg-primary/90 data-pressed:bg-primary/90 *:data-[slot=button-loading-indicator]:text-primary-foreground [:active,[data-pressed]]:inset-shadow-[0_1px_--theme(--color-black/8%)] [:disabled,:active,[data-pressed]]:shadow-none",
        destructive:
          "border-destructive bg-destructive text-white shadow-xs shadow-destructive/24 not-disabled:inset-shadow-[0_1px_--theme(--color-white/16%)] hover:bg-destructive/90 data-pressed:bg-destructive/90 *:data-[slot=button-loading-indicator]:text-white [:active,[data-pressed]]:inset-shadow-[0_1px_--theme(--color-black/8%)] [:disabled,:active,[data-pressed]]:shadow-none",
        "destructive-outline":
          "border-input bg-popover text-destructive-foreground shadow-xs/5 not-dark:bg-clip-padding not-disabled:not-active:not-data-pressed:before:shadow-[0_1px_--theme(--color-black/4%)] hover:border-destructive/32 hover:bg-destructive/4 data-pressed:border-destructive/32 data-pressed:bg-destructive/4 *:data-[slot=button-loading-indicator]:text-foreground dark:bg-input/32 dark:not-disabled:before:shadow-[0_-1px_--theme(--color-white/2%)] dark:not-disabled:not-active:not-data-pressed:before:shadow-[0_-1px_--theme(--color-white/6%)] [:disabled,:active,[data-pressed]]:shadow-none",
        ghost:
          "border-transparent text-foreground hover:bg-accent data-pressed:bg-accent *:data-[slot=button-loading-indicator]:text-foreground",
        link: "border-transparent text-foreground underline-offset-4 hover:underline data-pressed:underline *:data-[slot=button-loading-indicator]:text-foreground",
        outline:
          "border-input bg-popover text-foreground shadow-xs/5 not-dark:bg-clip-padding not-disabled:not-active:not-data-pressed:before:shadow-[0_1px_--theme(--color-black/4%)] hover:bg-accent/50 data-pressed:bg-accent/50 *:data-[slot=button-loading-indicator]:text-foreground dark:bg-input/32 dark:not-disabled:before:shadow-[0_-1px_--theme(--color-white/2%)] dark:not-disabled:not-active:not-data-pressed:before:shadow-[0_-1px_--theme(--color-white/6%)] dark:hover:bg-input/64 dark:data-pressed:bg-input/64 [:disabled,:active,[data-pressed]]:shadow-none",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/90 data-pressed:bg-secondary/90 *:data-[slot=button-loading-indicator]:text-secondary-foreground [:active,[data-pressed]]:bg-secondary/80",
        violet:
          "border-violet-500/30 bg-violet-500/15 text-violet-700 shadow-xs/5 not-dark:bg-clip-padding not-disabled:not-active:not-data-pressed:before:shadow-[0_1px_--theme(--color-black/4%)] hover:bg-violet-500/22 hover:text-violet-500 data-pressed:bg-violet-500/22 *:data-[slot=button-loading-indicator]:text-violet-700 dark:border-violet-500/25 dark:bg-violet-500/12 dark:text-violet-400 dark:hover:bg-violet-500/20 dark:hover:text-violet-500 dark:data-pressed:bg-violet-500/20 dark:*:data-[slot=button-loading-indicator]:text-violet-400 [:disabled,:active,[data-pressed]]:shadow-none",

        // Solid color variants — filled, white foreground.
        orange:
          "border-orange-500 bg-orange-500 text-white shadow-xs shadow-orange-500/24 not-disabled:inset-shadow-[0_1px_--theme(--color-white/16%)] hover:bg-orange-500/90 data-pressed:bg-orange-500/90 *:data-[slot=button-loading-indicator]:text-white [:active,[data-pressed]]:inset-shadow-[0_1px_--theme(--color-black/8%)] [:disabled,:active,[data-pressed]]:shadow-none",
        amber:
          "border-amber-500 bg-amber-500 text-amber-950 shadow-xs shadow-amber-500/24 not-disabled:inset-shadow-[0_1px_--theme(--color-white/24%)] hover:bg-amber-500/90 data-pressed:bg-amber-500/90 *:data-[slot=button-loading-indicator]:text-amber-950 [:active,[data-pressed]]:inset-shadow-[0_1px_--theme(--color-black/8%)] [:disabled,:active,[data-pressed]]:shadow-none",
        green:
          "border-green-500 bg-green-500 text-white shadow-xs shadow-green-500/24 not-disabled:inset-shadow-[0_1px_--theme(--color-white/16%)] hover:bg-green-500/90 data-pressed:bg-green-500/90 *:data-[slot=button-loading-indicator]:text-white [:active,[data-pressed]]:inset-shadow-[0_1px_--theme(--color-black/8%)] [:disabled,:active,[data-pressed]]:shadow-none",
        emerald:
          "border-emerald-500 bg-emerald-500 text-white shadow-xs shadow-emerald-500/24 not-disabled:inset-shadow-[0_1px_--theme(--color-white/16%)] hover:bg-emerald-500/90 data-pressed:bg-emerald-500/90 *:data-[slot=button-loading-indicator]:text-white [:active,[data-pressed]]:inset-shadow-[0_1px_--theme(--color-black/8%)] [:disabled,:active,[data-pressed]]:shadow-none",
        teal: "border-teal-500 bg-teal-500 text-white shadow-xs shadow-teal-500/24 not-disabled:inset-shadow-[0_1px_--theme(--color-white/16%)] hover:bg-teal-500/90 data-pressed:bg-teal-500/90 *:data-[slot=button-loading-indicator]:text-white [:active,[data-pressed]]:inset-shadow-[0_1px_--theme(--color-black/8%)] [:disabled,:active,[data-pressed]]:shadow-none",
        cyan: "border-cyan-500 bg-cyan-500 text-cyan-950 shadow-xs shadow-cyan-500/24 not-disabled:inset-shadow-[0_1px_--theme(--color-white/24%)] hover:bg-cyan-500/90 data-pressed:bg-cyan-500/90 *:data-[slot=button-loading-indicator]:text-cyan-950 [:active,[data-pressed]]:inset-shadow-[0_1px_--theme(--color-black/8%)] [:disabled,:active,[data-pressed]]:shadow-none",
        sky: "border-sky-500 bg-sky-500 text-white shadow-xs shadow-sky-500/24 not-disabled:inset-shadow-[0_1px_--theme(--color-white/16%)] hover:bg-sky-500/90 data-pressed:bg-sky-500/90 *:data-[slot=button-loading-indicator]:text-white [:active,[data-pressed]]:inset-shadow-[0_1px_--theme(--color-black/8%)] [:disabled,:active,[data-pressed]]:shadow-none",
        blue: "border-blue-500 bg-blue-500 text-white shadow-xs shadow-blue-500/24 not-disabled:inset-shadow-[0_1px_--theme(--color-white/16%)] hover:bg-blue-500/90 data-pressed:bg-blue-500/90 *:data-[slot=button-loading-indicator]:text-white [:active,[data-pressed]]:inset-shadow-[0_1px_--theme(--color-black/8%)] [:disabled,:active,[data-pressed]]:shadow-none",
        indigo:
          "border-indigo-500 bg-indigo-500 text-white shadow-xs shadow-indigo-500/24 not-disabled:inset-shadow-[0_1px_--theme(--color-white/16%)] hover:bg-indigo-500/90 data-pressed:bg-indigo-500/90 *:data-[slot=button-loading-indicator]:text-white [:active,[data-pressed]]:inset-shadow-[0_1px_--theme(--color-black/8%)] [:disabled,:active,[data-pressed]]:shadow-none",
        purple:
          "border-purple-500 bg-purple-500 text-white shadow-xs shadow-purple-500/24 not-disabled:inset-shadow-[0_1px_--theme(--color-white/16%)] hover:bg-purple-500/90 data-pressed:bg-purple-500/90 *:data-[slot=button-loading-indicator]:text-white [:active,[data-pressed]]:inset-shadow-[0_1px_--theme(--color-black/8%)] [:disabled,:active,[data-pressed]]:shadow-none",
        pink: "border-pink-500 bg-pink-500 text-white shadow-xs shadow-pink-500/24 not-disabled:inset-shadow-[0_1px_--theme(--color-white/16%)] hover:bg-pink-500/90 data-pressed:bg-pink-500/90 *:data-[slot=button-loading-indicator]:text-white [:active,[data-pressed]]:inset-shadow-[0_1px_--theme(--color-black/8%)] [:disabled,:active,[data-pressed]]:shadow-none",
        rose: "border-rose-500 bg-rose-500 text-white shadow-xs shadow-rose-500/24 not-disabled:inset-shadow-[0_1px_--theme(--color-white/16%)] hover:bg-rose-500/90 data-pressed:bg-rose-500/90 *:data-[slot=button-loading-indicator]:text-white [:active,[data-pressed]]:inset-shadow-[0_1px_--theme(--color-black/8%)] [:disabled,:active,[data-pressed]]:shadow-none",
        red: "border-red-500 bg-red-500 text-white shadow-xs shadow-red-500/24 not-disabled:inset-shadow-[0_1px_--theme(--color-white/16%)] hover:bg-red-500/90 data-pressed:bg-red-500/90 *:data-[slot=button-loading-indicator]:text-white [:active,[data-pressed]]:inset-shadow-[0_1px_--theme(--color-black/8%)] [:disabled,:active,[data-pressed]]:shadow-none",

        // Subtle color variants — tinted background, colored foreground.
        "orange-subtle":
          "border-orange-500/25 bg-orange-500/15 text-orange-600 shadow-xs/5 not-dark:bg-clip-padding hover:bg-orange-500/22 hover:text-orange-500 data-pressed:bg-orange-500/22 *:data-[slot=button-loading-indicator]:text-orange-600 dark:border-orange-400/25 dark:bg-orange-400/15 dark:text-orange-400 dark:hover:bg-orange-400/22 dark:*:data-[slot=button-loading-indicator]:text-orange-400 [:disabled,:active,[data-pressed]]:shadow-none",
        "amber-subtle":
          "border-amber-500/25 bg-amber-500/15 text-amber-600 shadow-xs/5 not-dark:bg-clip-padding hover:bg-amber-500/22 hover:text-amber-500 data-pressed:bg-amber-500/22 *:data-[slot=button-loading-indicator]:text-amber-600 dark:border-amber-400/25 dark:bg-amber-400/15 dark:text-amber-400 dark:hover:bg-amber-400/22 dark:*:data-[slot=button-loading-indicator]:text-amber-400 [:disabled,:active,[data-pressed]]:shadow-none",
        "yellow-subtle":
          "border-yellow-500/25 bg-yellow-500/15 text-yellow-600 shadow-xs/5 not-dark:bg-clip-padding hover:bg-yellow-500/22 hover:text-yellow-500 data-pressed:bg-yellow-500/22 *:data-[slot=button-loading-indicator]:text-yellow-600 dark:border-yellow-400/25 dark:bg-yellow-400/15 dark:text-yellow-400 dark:hover:bg-yellow-400/22 dark:*:data-[slot=button-loading-indicator]:text-yellow-400 [:disabled,:active,[data-pressed]]:shadow-none",
        "lime-subtle":
          "border-lime-500/25 bg-lime-500/15 text-lime-600 shadow-xs/5 not-dark:bg-clip-padding hover:bg-lime-500/22 hover:text-lime-500 data-pressed:bg-lime-500/22 *:data-[slot=button-loading-indicator]:text-lime-600 dark:border-lime-400/25 dark:bg-lime-400/15 dark:text-lime-400 dark:hover:bg-lime-400/22 dark:*:data-[slot=button-loading-indicator]:text-lime-400 [:disabled,:active,[data-pressed]]:shadow-none",
        "green-subtle":
          "border-green-500/25 bg-green-500/15 text-green-600 shadow-xs/5 not-dark:bg-clip-padding hover:bg-green-500/22 hover:text-green-500 data-pressed:bg-green-500/22 *:data-[slot=button-loading-indicator]:text-green-600 dark:border-green-400/25 dark:bg-green-400/15 dark:text-green-400 dark:hover:bg-green-400/22 dark:*:data-[slot=button-loading-indicator]:text-green-400 [:disabled,:active,[data-pressed]]:shadow-none",
        "emerald-subtle":
          "border-emerald-500/25 bg-emerald-500/15 text-emerald-600 shadow-xs/5 not-dark:bg-clip-padding hover:bg-emerald-500/22 hover:text-emerald-500 data-pressed:bg-emerald-500/22 *:data-[slot=button-loading-indicator]:text-emerald-600 dark:border-emerald-400/25 dark:bg-emerald-400/15 dark:text-emerald-400 dark:hover:bg-emerald-400/22 dark:*:data-[slot=button-loading-indicator]:text-emerald-400 [:disabled,:active,[data-pressed]]:shadow-none",
        "teal-subtle":
          "border-teal-500/25 bg-teal-500/15 text-teal-600 shadow-xs/5 not-dark:bg-clip-padding hover:bg-teal-500/22 hover:text-teal-500 data-pressed:bg-teal-500/22 *:data-[slot=button-loading-indicator]:text-teal-600 dark:border-teal-400/25 dark:bg-teal-400/15 dark:text-teal-400 dark:hover:bg-teal-400/22 dark:*:data-[slot=button-loading-indicator]:text-teal-400 [:disabled,:active,[data-pressed]]:shadow-none",
        "cyan-subtle":
          "border-cyan-500/25 bg-cyan-500/15 text-cyan-600 shadow-xs/5 not-dark:bg-clip-padding hover:bg-cyan-500/22 hover:text-cyan-500 data-pressed:bg-cyan-500/22 *:data-[slot=button-loading-indicator]:text-cyan-600 dark:border-cyan-400/25 dark:bg-cyan-400/15 dark:text-cyan-400 dark:hover:bg-cyan-400/22 dark:*:data-[slot=button-loading-indicator]:text-cyan-400 [:disabled,:active,[data-pressed]]:shadow-none",
        "sky-subtle":
          "border-sky-500/25 bg-sky-500/15 text-sky-600 shadow-xs/5 not-dark:bg-clip-padding hover:bg-sky-500/22 hover:text-sky-500 data-pressed:bg-sky-500/22 *:data-[slot=button-loading-indicator]:text-sky-600 dark:border-sky-400/25 dark:bg-sky-400/15 dark:text-sky-400 dark:hover:bg-sky-400/22 dark:*:data-[slot=button-loading-indicator]:text-sky-400 [:disabled,:active,[data-pressed]]:shadow-none",
        "blue-subtle":
          "border-blue-500/25 bg-blue-500/15 text-blue-600 shadow-xs/5 not-dark:bg-clip-padding hover:bg-blue-500/22 hover:text-blue-500 data-pressed:bg-blue-500/22 *:data-[slot=button-loading-indicator]:text-blue-600 dark:border-blue-400/25 dark:bg-blue-400/15 dark:text-blue-400 dark:hover:bg-blue-400/22 dark:*:data-[slot=button-loading-indicator]:text-blue-400 [:disabled,:active,[data-pressed]]:shadow-none",
        "indigo-subtle":
          "border-indigo-500/25 bg-indigo-500/15 text-indigo-600 shadow-xs/5 not-dark:bg-clip-padding hover:bg-indigo-500/22 hover:text-indigo-500 data-pressed:bg-indigo-500/22 *:data-[slot=button-loading-indicator]:text-indigo-600 dark:border-indigo-400/25 dark:bg-indigo-400/15 dark:text-indigo-400 dark:hover:bg-indigo-400/22 dark:*:data-[slot=button-loading-indicator]:text-indigo-400 [:disabled,:active,[data-pressed]]:shadow-none",
        "violet-subtle":
          "border-violet-500/25 bg-violet-500/15 text-violet-600 shadow-xs/5 not-dark:bg-clip-padding hover:bg-violet-500/22 hover:text-violet-500 data-pressed:bg-violet-500/22 *:data-[slot=button-loading-indicator]:text-violet-600 dark:border-violet-400/25 dark:bg-violet-400/15 dark:text-violet-400 dark:hover:bg-violet-400/22 dark:*:data-[slot=button-loading-indicator]:text-violet-400 [:disabled,:active,[data-pressed]]:shadow-none",
        "purple-subtle":
          "border-purple-500/25 bg-purple-500/15 text-purple-600 shadow-xs/5 not-dark:bg-clip-padding hover:bg-purple-500/22 hover:text-purple-500 data-pressed:bg-purple-500/22 *:data-[slot=button-loading-indicator]:text-purple-600 dark:border-purple-400/25 dark:bg-purple-400/15 dark:text-purple-400 dark:hover:bg-purple-400/22 dark:*:data-[slot=button-loading-indicator]:text-purple-400 [:disabled,:active,[data-pressed]]:shadow-none",
        "fuchsia-subtle":
          "border-fuchsia-500/25 bg-fuchsia-500/15 text-fuchsia-600 shadow-xs/5 not-dark:bg-clip-padding hover:bg-fuchsia-500/22 hover:text-fuchsia-500 data-pressed:bg-fuchsia-500/22 *:data-[slot=button-loading-indicator]:text-fuchsia-600 dark:border-fuchsia-400/25 dark:bg-fuchsia-400/15 dark:text-fuchsia-400 dark:hover:bg-fuchsia-400/22 dark:*:data-[slot=button-loading-indicator]:text-fuchsia-400 [:disabled,:active,[data-pressed]]:shadow-none",
        "pink-subtle":
          "border-pink-500/25 bg-pink-500/15 text-pink-600 shadow-xs/5 not-dark:bg-clip-padding hover:bg-pink-500/22 hover:text-pink-500 data-pressed:bg-pink-500/22 *:data-[slot=button-loading-indicator]:text-pink-600 dark:border-pink-400/25 dark:bg-pink-400/15 dark:text-pink-400 dark:hover:bg-pink-400/22 dark:*:data-[slot=button-loading-indicator]:text-pink-400 [:disabled,:active,[data-pressed]]:shadow-none",
        "rose-subtle":
          "border-rose-500/25 bg-rose-500/15 text-rose-600 shadow-xs/5 not-dark:bg-clip-padding hover:bg-rose-500/22 hover:text-rose-500 data-pressed:bg-rose-500/22 *:data-[slot=button-loading-indicator]:text-rose-600 dark:border-rose-400/25 dark:bg-rose-400/15 dark:text-rose-400 dark:hover:bg-rose-400/22 dark:*:data-[slot=button-loading-indicator]:text-rose-400 [:disabled,:active,[data-pressed]]:shadow-none",
        "red-subtle":
          "border-red-500/25 bg-red-500/15 text-red-600 shadow-xs/5 not-dark:bg-clip-padding hover:bg-red-500/22 hover:text-red-500 data-pressed:bg-red-500/22 *:data-[slot=button-loading-indicator]:text-red-600 dark:border-red-400/25 dark:bg-red-400/15 dark:text-red-400 dark:hover:bg-red-400/22 dark:*:data-[slot=button-loading-indicator]:text-red-400 [:disabled,:active,[data-pressed]]:shadow-none",
      },
    },
  }
)

export interface ButtonProps extends useRender.ComponentProps<"button"> {
  variant?: VariantProps<typeof buttonVariants>["variant"]
  size?: VariantProps<typeof buttonVariants>["size"]
  loading?: boolean
  /** Disable the subtle scale-on-press feedback when motion would be distracting. */
  static?: boolean
}

/** Tactile scale-on-press. Always 0.96 — anything below 0.95 reads as exaggerated. */
const tapScale =
  "not-disabled:active:scale-[0.96] not-disabled:data-pressed:scale-[0.96]"

export function Button({
  className,
  variant,
  size,
  render,
  children,
  loading = false,
  static: isStatic = false,
  disabled: disabledProp,
  ...props
}: ButtonProps): React.ReactElement {
  const isDisabled: boolean = Boolean(loading || disabledProp)
  const typeValue: React.ButtonHTMLAttributes<HTMLButtonElement>["type"] =
    render ? undefined : "button"

  const defaultProps = {
    children: (
      <>
        {children}
        {loading && (
          <Spinner
            className="pointer-events-none absolute"
            data-slot="button-loading-indicator"
          />
        )}
      </>
    ),
    className: cn(
      buttonVariants({ size, variant }),
      !isStatic && tapScale,
      className
    ),
    "aria-disabled": loading || undefined,
    "data-loading": loading ? "" : undefined,
    "data-slot": "button",
    disabled: isDisabled,
    type: typeValue,
  }

  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(defaultProps, props),
    render,
  })
}
