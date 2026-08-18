"use client"

import {
  createContext,
  Fragment,
  useContext,
  useMemo,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react"
import type { Day as WeekDay } from "date-fns"
import {
  differenceInCalendarDays,
  eachDayOfInterval,
  formatISO,
  getDay,
  getMonth,
  getYear,
  nextDay,
  parseISO,
  subWeeks,
} from "date-fns"

import { cn } from "@workspace/ui/lib/utils"

export type Activity = {
  date: string
  count: number
  level: number
}

type Week = Array<Activity | undefined>

export type Labels = {
  months?: string[]
  weekdays?: string[]
  totalCount?: string
  legend?: {
    less?: string
    more?: string
  }
  /** Resolves a week's month label from its first day. Takes priority over
   *  `months` — use this for calendars that aren't Gregorian-month-aligned
   *  (e.g. formatting with a Persian/Jalali calendar via `Intl.DateTimeFormat`),
   *  since `months[getMonth(date)]` assumes Gregorian month boundaries. */
  monthFormatter?: (date: Date) => string
}

type MonthLabel = {
  weekIndex: number
  label: string
}

const DEFAULT_MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

const DEFAULT_LABELS: Labels = {
  months: DEFAULT_MONTH_LABELS,
  weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  totalCount: "{{count}} activities in {{year}}",
  legend: {
    less: "Less",
    more: "More",
  },
}

const THEME = cn(
  'data-[level="0"]:fill-muted-foreground/5',
  'data-[level="1"]:fill-muted-foreground/20',
  'data-[level="2"]:fill-muted-foreground/40',
  'data-[level="3"]:fill-muted-foreground/60',
  'data-[level="4"]:fill-muted-foreground/80'
)

type ContributionGraphContextType = {
  data: Activity[]
  weeks: Week[]
  blockMargin: number
  blockRadius: number
  blockSize: number
  fontSize: number
  labels: Labels
  labelHeight: number
  maxLevel: number
  totalCount: number
  weekStart: WeekDay
  year: number
  width: number
  height: number
}

const ContributionGraphContext =
  createContext<ContributionGraphContextType | null>(null)

const useContributionGraph = () => {
  const context = useContext(ContributionGraphContext)

  if (!context) {
    throw new Error(
      "ContributionGraph components must be used within a ContributionGraph"
    )
  }

  return context
}

const fillHoles = (activities: Activity[]): Activity[] => {
  if (activities.length === 0) {
    return []
  }

  // Sort activities by date to ensure correct date range
  const sortedActivities = [...activities].sort((a, b) =>
    a.date.localeCompare(b.date)
  )

  const calendar = new Map<string, Activity>(activities.map((a) => [a.date, a]))

  const firstActivity = sortedActivities[0] as Activity
  const lastActivity = sortedActivities.at(-1)

  if (!lastActivity) {
    return []
  }

  return eachDayOfInterval({
    start: parseISO(firstActivity.date),
    end: parseISO(lastActivity.date),
  }).map((day) => {
    const date = formatISO(day, { representation: "date" })

    if (calendar.has(date)) {
      return calendar.get(date) as Activity
    }

    return {
      date,
      count: 0,
      level: 0,
    }
  })
}

const groupByWeeks = (
  activities: Activity[],
  weekStart: WeekDay = 0
): Week[] => {
  if (activities.length === 0) {
    return []
  }

  const normalizedActivities = fillHoles(activities)
  const firstActivity = normalizedActivities[0] as Activity
  const firstDate = parseISO(firstActivity.date)
  const firstCalendarDate =
    getDay(firstDate) === weekStart
      ? firstDate
      : subWeeks(nextDay(firstDate, weekStart), 1)

  const paddedActivities = [
    ...(new Array(differenceInCalendarDays(firstDate, firstCalendarDate)).fill(
      undefined
    ) as Activity[]),
    ...normalizedActivities,
  ]

  const numberOfWeeks = Math.ceil(paddedActivities.length / 7)

  return new Array(numberOfWeeks)
    .fill(undefined)
    .map((_, weekIndex) =>
      paddedActivities.slice(weekIndex * 7, weekIndex * 7 + 7)
    )
}

const getMonthLabels = (
  weeks: Week[],
  monthNames: string[] = DEFAULT_MONTH_LABELS,
  monthFormatter?: (date: Date) => string
): MonthLabel[] => {
  return dedupeWrappedYearLabel(
    weeks
      .reduce<MonthLabel[]>((labels, week, weekIndex) => {
        const firstActivity = week.find((activity) => activity !== undefined)

        if (!firstActivity) {
          throw new Error(
            `Unexpected error: Week ${weekIndex + 1} is empty: [${week}].`
          )
        }

        const date = parseISO(firstActivity.date)
        const month = monthFormatter
          ? monthFormatter(date)
          : monthNames[getMonth(date)]

        if (!month) {
          const monthName = new Date(firstActivity.date).toLocaleString(
            "en-US",
            {
              month: "short",
            }
          )
          throw new Error(
            `Unexpected error: undefined month label for ${monthName}.`
          )
        }

        const prevLabel = labels.at(-1)

        if (weekIndex === 0 || !prevLabel || prevLabel.label !== month) {
          return labels.concat({ weekIndex, label: month })
        }

        return labels
      }, [])
      .filter(({ weekIndex }, index, labels) => {
        const minWeeks = 3

        if (index === 0) {
          return labels[1] && labels[1].weekIndex - weekIndex >= minWeeks
        }

        // The last label is always kept, however few weeks it spans — it's
        // the current/most-recent month (there's nothing further right for
        // it to visually crowd), and for an always-ends-today rolling
        // calendar, hiding it would mean the month "today" falls in is never
        // shown at all (this previously dropped the current month whenever
        // it had fewer than 3 weeks of history so far).
        return true
      })
  )
}

/** For a ~365-day rolling window, the first and last label can legitimately
 *  be the same month name a year apart (e.g. "تیر" at both ends) — there's
 *  no year shown alongside it, so a repeated name reads as a duplicate/bug
 *  rather than "a year has passed". Drop the (less relevant, mostly-past)
 *  first one and keep the current one at the end. */
function dedupeWrappedYearLabel(labels: MonthLabel[]): MonthLabel[] {
  if (labels.length < 2) {
    return labels
  }
  const first = labels[0]!
  const last = labels[labels.length - 1]!
  if (first.label === last.label) {
    return labels.slice(1)
  }
  return labels
}

export type ContributionGraphProps = HTMLAttributes<HTMLDivElement> & {
  data: Activity[]
  blockMargin?: number
  blockRadius?: number
  blockSize?: number
  fontSize?: number
  labels?: Labels
  maxLevel?: number
  style?: CSSProperties
  totalCount?: number
  weekStart?: WeekDay
  children: ReactNode
  className?: string
}

export const ContributionGraph = ({
  data,
  blockMargin = 4,
  blockRadius = 2,
  blockSize = 12,
  fontSize = 14,
  labels: labelsProp = undefined,
  maxLevel: maxLevelProp = 4,
  style = {},
  totalCount: totalCountProp = undefined,
  weekStart = 0,
  className,
  ...props
}: ContributionGraphProps) => {
  const maxLevel = Math.max(1, maxLevelProp)
  const weeks = useMemo(() => groupByWeeks(data, weekStart), [data, weekStart])
  const LABEL_MARGIN = 8

  const labels = { ...DEFAULT_LABELS, ...labelsProp }
  const labelHeight = fontSize + LABEL_MARGIN

  const year = data[0]
    ? getYear(parseISO(data[0].date))
    : new Date().getFullYear()

  const totalCount =
    typeof totalCountProp === "number"
      ? totalCountProp
      : data.reduce((sum, activity) => sum + activity.count, 0)

  const width = weeks.length * (blockSize + blockMargin) - blockMargin
  const height = labelHeight + (blockSize + blockMargin) * 7 - blockMargin

  if (data.length === 0) {
    return null
  }

  return (
    <ContributionGraphContext.Provider
      value={{
        data,
        weeks,
        blockMargin,
        blockRadius,
        blockSize,
        fontSize,
        labels,
        labelHeight,
        maxLevel,
        totalCount,
        weekStart,
        year,
        width,
        height,
      }}
    >
      <div
        className={cn("flex w-max max-w-full flex-col gap-2", className)}
        style={{ fontSize, ...style }}
        {...props}
      />
    </ContributionGraphContext.Provider>
  )
}

export type ContributionGraphBlockProps = HTMLAttributes<SVGRectElement> & {
  activity: Activity
  dayIndex: number
  weekIndex: number
}

export const ContributionGraphBlock = ({
  activity,
  dayIndex,
  weekIndex,
  className,
  ...props
}: ContributionGraphBlockProps) => {
  const { blockSize, blockMargin, blockRadius, labelHeight, maxLevel } =
    useContributionGraph()

  if (activity.level < 0 || activity.level > maxLevel) {
    throw new RangeError(
      `Provided activity level ${activity.level} for ${activity.date} is out of range. It must be between 0 and ${maxLevel}.`
    )
  }

  return (
    <rect
      className={cn(THEME, className)}
      data-count={activity.count}
      data-date={activity.date}
      data-level={activity.level}
      height={blockSize}
      rx={blockRadius}
      ry={blockRadius}
      width={blockSize}
      x={(blockSize + blockMargin) * weekIndex}
      y={labelHeight + (blockSize + blockMargin) * dayIndex}
      {...props}
    />
  )
}

export type ContributionGraphCalendarProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> & {
  hideMonthLabels?: boolean
  className?: string
  children: (props: {
    activity: Activity
    dayIndex: number
    weekIndex: number
  }) => ReactNode
}

export const ContributionGraphCalendar = ({
  title = "Contribution Graph",
  hideMonthLabels = false,
  className,
  children,
  ...props
}: ContributionGraphCalendarProps) => {
  const { weeks, width, height, blockSize, blockMargin, labels } =
    useContributionGraph()

  const monthLabels = useMemo(
    () => getMonthLabels(weeks, labels.months, labels.monthFormatter),
    [weeks, labels.months, labels.monthFormatter]
  )

  return (
    <div
      className={cn(
        // No `justify-center` here — centering a flex container's overflow
        // (not just the item) is a known footgun: browsers can make the
        // "start" side of the overflow unreachable by scroll. `mx-auto` on
        // the `<svg>` itself gets the same visual centering when it fits,
        // but correctly collapses to 0 and reverts to normal start-aligned
        // (this container's own `dir` decides which edge that is) scrolling
        // once it overflows — so e.g. `dir="rtl"` still defaults to showing
        // the right edge (today) with no scroll needed.
        "no-scrollbar flex max-w-full scroll-fade-x overflow-x-auto overflow-y-hidden",
        className
      )}
      {...props}
    >
      <svg
        // The calendar's internal geometry (block x-positions, month-label
        // text-anchor) is always laid out left→right / oldest→newest, so it
        // needs `ltr` regardless of the surrounding app or scroll-container
        // direction — otherwise `text-anchor`'s "start" keyword flips to the
        // right and month labels render shifted/misaligned. (`style` here,
        // not the `dir` attribute — React's SVG typings don't include it.)
        style={{ direction: "ltr" }}
        className="mx-auto block overflow-visible"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        width={width}
      >
        <title>{title}</title>
        {!hideMonthLabels && (
          <g
            data-slot="month-labels"
            className="selection:fill-selection-foreground fill-current"
          >
            {monthLabels.map(({ label, weekIndex }) => (
              <text
                dominantBaseline="hanging"
                textAnchor="start"
                key={weekIndex}
                x={(blockSize + blockMargin) * weekIndex}
              >
                {label}
              </text>
            ))}
          </g>
        )}
        {weeks.map((week, weekIndex) =>
          week.map((activity, dayIndex) => {
            if (!activity) {
              return null
            }

            return (
              <Fragment key={`${weekIndex}-${dayIndex}`}>
                {children({ activity, dayIndex, weekIndex })}
              </Fragment>
            )
          })
        )}
      </svg>
    </div>
  )
}

export type ContributionGraphFooterProps = HTMLAttributes<HTMLDivElement>

export const ContributionGraphFooter = ({
  className,
  ...props
}: ContributionGraphFooterProps) => (
  <div
    className={cn(
      "flex flex-wrap gap-1 whitespace-nowrap sm:gap-x-4",
      className
    )}
    {...props}
  />
)

export type ContributionGraphTotalCountProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> & {
  children?: (props: { totalCount: number; year: number }) => ReactNode
}

export const ContributionGraphTotalCount = ({
  className,
  children,
  ...props
}: ContributionGraphTotalCountProps) => {
  const { totalCount, year, labels } = useContributionGraph()

  if (children) {
    return <>{children({ totalCount, year })}</>
  }

  return (
    <div className={cn("text-muted-foreground", className)} {...props}>
      {labels.totalCount
        ? labels.totalCount
            .replace("{{count}}", String(totalCount))
            .replace("{{year}}", String(year))
        : `${totalCount} activities in ${year}`}
    </div>
  )
}

export type ContributionGraphLegendProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> & {
  children?: (props: { level: number }) => ReactNode
}

export const ContributionGraphLegend = ({
  className,
  children,
  ...props
}: ContributionGraphLegendProps) => {
  const { labels, maxLevel, blockSize, blockRadius, blockMargin } =
    useContributionGraph()

  return (
    <div
      className={cn("ms-auto flex items-center", className)}
      style={{ gap: blockMargin }}
      {...props}
    >
      <span className="me-1 text-muted-foreground">
        {labels.legend?.less || "Less"}
      </span>

      {new Array(maxLevel + 1).fill(undefined).map((_, level) =>
        children ? (
          <Fragment key={level}>{children({ level })}</Fragment>
        ) : (
          <svg height={blockSize} key={level} width={blockSize}>
            <title>{`${level} contributions`}</title>
            <rect
              className={cn(THEME)}
              data-level={level}
              height={blockSize}
              rx={blockRadius}
              ry={blockRadius}
              width={blockSize}
            />
          </svg>
        )
      )}

      <span className="ms-1 text-muted-foreground">
        {labels.legend?.more || "More"}
      </span>
    </div>
  )
}
