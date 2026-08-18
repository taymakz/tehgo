"use client"

import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"

const MAX = 5

function StarIcon({
  filled,
  className,
}: {
  filled: boolean
  className?: string
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.5}
      className={className}
    >
      <path d="M12 2.5 15.09 8.76l6.91 1.01-5 4.87 1.18 6.88L12 18.27l-6.18 3.25 1.18-6.88-5-4.87 6.91-1.01L12 2.5Z" />
    </svg>
  )
}

/**
 * Read-only star rating display — avg rating + count summary, or a single
 * review's stars. Interactive input mode is `RatingInput` below.
 */
export function Rating({
  value,
  size = "sm",
  className,
}: {
  value: number
  size?: "xs" | "sm" | "md"
  className?: string
}) {
  const sizeClass = {
    xs: "size-3",
    sm: "size-4",
    md: "size-5",
  }[size]

  return (
    <div
      className={cn("flex items-center justify-end gap-0.5", className)}
      dir="ltr"
    >
      {Array.from({ length: MAX }).map((_, i) => (
        <StarIcon
          key={i}
          filled={i < Math.round(value)}
          className={cn(
            sizeClass,
            i < Math.round(value)
              ? "text-amber-500"
              : "text-muted-foreground/30"
          )}
        />
      ))}
    </div>
  )
}

/** Interactive 1-5 star rating input (click to set, hover to preview). */
export function RatingInput({
  value,
  onChange,
  size = "md",
  className,
  disabled,
}: {
  value: number
  onChange: (value: number) => void
  size?: "xs" | "sm" | "md"
  className?: string
  disabled?: boolean
}) {
  const [hover, setHover] = React.useState<number | null>(null)
  const display = hover ?? value

  const sizeClass = {
    xs: "size-4",
    sm: "size-5",
    md: "size-7",
  }[size]

  return (
    <div
      className={cn("flex items-center gap-1", className)}
      dir="ltr"
      onMouseLeave={() => setHover(null)}
    >
      {Array.from({ length: MAX }).map((_, i) => {
        const starValue = i + 1
        return (
          <button
            key={i}
            type="button"
            disabled={disabled}
            aria-label={`${starValue} از ${MAX} ستاره`}
            className="rounded-sm transition-transform outline-none not-disabled:hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            onMouseEnter={() => setHover(starValue)}
            onClick={() => onChange(starValue)}
          >
            <StarIcon
              filled={starValue <= display}
              className={cn(
                sizeClass,
                starValue <= display
                  ? "text-amber-500"
                  : "text-muted-foreground/30"
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
