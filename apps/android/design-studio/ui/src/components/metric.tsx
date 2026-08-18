import { cn } from "@workspace/ui/lib/utils"

export function Metric({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="metric"
      className={cn(
        "flex flex-col gap-2 p-4",
        "max-md:nth-[2n+1]:screen-line-bottom md:nth-[4n+1]:screen-line-bottom",
        className
      )}
      {...props}
    />
  )
}

export function MetricLabel({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <dt
      data-slot="metric-label"
      className={cn("text-sm leading-none text-muted-foreground", className)}
      {...props}
    />
  )
}

export function MetricValue({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <dd
      data-slot="metric-value"
      className={cn(
        "text-lg leading-none font-semibold tabular-nums",
        className
      )}
      {...props}
    />
  )
}
