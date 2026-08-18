import { cn } from "../lib/utils"

type Variant = "icon" | "horizontal" | "vertical"
type Locale = "en" | "fa"

interface AppLogoProps {
  variant?: Variant
  locale?: Locale
  className?: string
  transparent?: boolean
}

function BadgeIcon({
  className,
  transparent = true,
}: {
  className?: string
  transparent?: boolean
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      {!transparent && <circle cx="50" cy="50" r="47" fill="#171717" />}

      <path
        d="M69.9,33.3 A26,26 0 1 0 69.9,66.7"
        fill="none"
        stroke="currentColor"
        strokeWidth="15"
        strokeLinecap="round"
      />
      <path
        d="M20,32 L20,20 L32,20"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
      <path
        d="M80,32 L80,20 L68,20"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
      <path
        d="M20,68 L20,80 L32,80"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
      <path
        d="M80,68 L80,80 L68,80"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
    </svg>
  )
}

export default function AppLogo({
  variant = "icon",
  locale = "en",
  className,
  transparent = true,
}: AppLogoProps) {
  if (variant === "icon") {
    return (
      <BadgeIcon
        className={cn("size-10", className)}
        transparent={transparent}
      />
    )
  }

  if (variant === "horizontal") {
    if (locale === "fa") {
      return (
        <div className={cn("flex items-center gap-3", className)} dir="rtl">
          <BadgeIcon className="size-10" transparent={transparent} />
          <div className="min-w-0">
            <p className="truncate text-sm leading-tight font-bold">
              <span className="text-foreground">کافیفای</span>
            </p>
            <p className="mt-px truncate text-[10px] font-medium tracking-wider text-muted-foreground">
              منوی دیجیتال ساز
            </p>
          </div>
        </div>
      )
    }

    return (
      <div className={cn("flex items-center gap-3", className)} dir="ltr">
        <BadgeIcon className="size-10" transparent={transparent} />
        <div className="min-w-0">
          <p className="truncate text-sm leading-tight font-bold tracking-tight">
            <span className="text-foreground">Cafi</span>
            <span className="text-amber-600 dark:text-amber-500">fy</span>
          </p>
          <p className="mt-px truncate text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
            DIGITAL MENU BUILDER
          </p>
        </div>
      </div>
    )
  }

  // vertical
  if (locale === "fa") {
    return (
      <div className={cn("flex flex-col items-center gap-2.5", className)}>
        <BadgeIcon className="size-14" transparent={transparent} />
        <div className="text-center" dir="rtl">
          <p className="text-lg leading-tight font-bold">
            <span className="text-foreground">کافیفای</span>
          </p>
          <p className="mt-0.5 text-[10px] font-medium text-muted-foreground">
            سازنده منوی دیجیتال
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn("flex flex-col items-center gap-2.5", className)}
      dir="ltr"
    >
      <BadgeIcon className="size-14" transparent={transparent} />
      <div className="text-center">
        <p className="text-lg leading-tight font-bold tracking-tight">
          <span className="text-foreground">Cafi</span>
          <span className="text-amber-600 dark:text-amber-500">fy</span>
        </p>
        <p className="mt-0.5 text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
          DIGITAL MENU BUILDER
        </p>
      </div>
    </div>
  )
}
