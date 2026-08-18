"use client"

import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"

// ── Context ────────────────────────────────────────────────────────────────────

interface ProgressContextValue {
  value: number | null
  min: number
  max: number
  percentage: number | null
  size: number
  strokeWidth: number
}

const ProgressContext = React.createContext<ProgressContextValue>({
  value: null,
  min: 0,
  max: 100,
  percentage: null,
  size: 48,
  strokeWidth: 4,
})

function useProgressContext() {
  return React.useContext(ProgressContext)
}

function getState(percentage: number | null): "indeterminate" | "loading" | "complete" {
  if (percentage == null) return "indeterminate"
  if (percentage >= 100) return "complete"
  return "loading"
}

// ── CircularProgress ──────────────────────────────────────────────────────────

interface CircularProgressProps extends React.ComponentProps<"div"> {
  value?: number | null
  min?: number
  max?: number
  size?: number
  strokeWidth?: number
}

function CircularProgress({
  value = null,
  min = 0,
  max = 100,
  size = 48,
  strokeWidth = 4,
  className,
  ...props
}: CircularProgressProps) {
  const clamped = value != null ? Math.min(Math.max(value, min), max) : null
  const percentage = clamped != null ? ((clamped - min) / (max - min)) * 100 : null
  const state = getState(percentage)

  return (
    <ProgressContext.Provider value={{ value: clamped, min, max, percentage, size, strokeWidth }}>
      <div
        role="progressbar"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={clamped ?? undefined}
        aria-valuetext={percentage != null ? `${Math.round(percentage)}%` : undefined}
        data-state={state}
        data-value={clamped ?? undefined}
        data-max={max}
        data-min={min}
        data-percentage={percentage ?? undefined}
        className={cn("relative inline-flex items-center justify-center", className)}
        {...props}
      />
    </ProgressContext.Provider>
  )
}

// ── CircularProgressIndicator ─────────────────────────────────────────────────

function CircularProgressIndicator({ className, ...props }: React.ComponentProps<"svg">) {
  const { value, min, max, percentage, size } = useProgressContext()
  const state = getState(percentage)

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      data-state={state}
      data-value={value ?? undefined}
      data-max={max}
      data-min={min}
      data-percentage={percentage ?? undefined}
      className={cn("-rotate-90", className)}
      {...props}
    />
  )
}

// ── CircularProgressTrack ─────────────────────────────────────────────────────

function CircularProgressTrack({ className, ...props }: React.ComponentProps<"circle">) {
  const { size, strokeWidth } = useProgressContext()
  const r = (size - strokeWidth) / 2

  return (
    <circle
      r={r}
      cx={size / 2}
      cy={size / 2}
      fill="none"
      strokeWidth={strokeWidth}
      className={cn("stroke-current text-muted/50", className)}
      {...props}
    />
  )
}

// ── CircularProgressRange ─────────────────────────────────────────────────────

function CircularProgressRange({ className, ...props }: React.ComponentProps<"circle">) {
  const { size, strokeWidth, percentage } = useProgressContext()
  const r = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * r
  const offset = percentage != null ? circumference * (1 - percentage / 100) : circumference

  return (
    <circle
      r={r}
      cx={size / 2}
      cy={size / 2}
      fill="none"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeDasharray={circumference}
      strokeDashoffset={offset}
      className={cn(
        "stroke-current text-primary transition-[stroke-dashoffset] duration-700 ease-out",
        className,
      )}
      {...props}
    />
  )
}

// ── CircularProgressValueText ─────────────────────────────────────────────────

function CircularProgressValueText({ className, children, ...props }: React.ComponentProps<"div">) {
  const { percentage } = useProgressContext()

  return (
    <div
      aria-hidden
      className={cn(
        "absolute inset-0 flex items-center justify-center font-mono text-[10px] font-semibold tabular-nums",
        className,
      )}
      {...props}
    >
      {children ?? (percentage != null ? `${Math.round(percentage)}%` : null)}
    </div>
  )
}

// ── CircularProgressCombined ──────────────────────────────────────────────────

function CircularProgressCombined({
  value,
  min,
  max,
  size,
  strokeWidth,
  className,
  children,
  ...props
}: CircularProgressProps) {
  return (
    <CircularProgress
      value={value}
      min={min}
      max={max}
      size={size}
      strokeWidth={strokeWidth}
      className={className}
      {...props}
    >
      <CircularProgressIndicator>
        <CircularProgressTrack />
        <CircularProgressRange />
      </CircularProgressIndicator>
      <CircularProgressValueText>{children}</CircularProgressValueText>
    </CircularProgress>
  )
}

export {
  CircularProgress,
  CircularProgressCombined,
  CircularProgressIndicator,
  CircularProgressRange,
  CircularProgressTrack,
  CircularProgressValueText,
}
