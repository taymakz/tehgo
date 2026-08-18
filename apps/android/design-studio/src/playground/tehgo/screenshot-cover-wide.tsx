import type { ComponentType } from "react"

// 16:9 landscape cover for stores that reject the portrait 4:5 Instagram
// layout (Myket/Cafebazaar's "تصویر کاور" upload wants 16:9). Same visual
// language as screenshot-cover.tsx — accent gradient, curved decorative
// line, phone mockup with a real screenshot — just reflowed horizontally:
// copy on the reading-start (right, since the app is RTL), phone on the
// left.

const SCREENSHOT_W = 578
const SCREENSHOT_H = 1280

function CurvedAccent({ color }: { color: string }) {
  return (
    <svg
      className="pointer-events-none absolute -bottom-[60px] left-[40px] opacity-70"
      width="420"
      height="300"
      viewBox="0 0 420 300"
      fill="none"
    >
      <path
        d="M 10 280 C 130 300, 150 180, 260 190 S 340 90, 410 20"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
      <circle
        cx="410"
        cy="20"
        r="9"
        stroke={color}
        strokeWidth="3"
        fill="white"
      />
    </svg>
  )
}

function PhoneMockup({ src, accent }: { src: string; accent: string }) {
  return (
    <div
      className="relative"
      style={{ height: 880, width: (880 * SCREENSHOT_W) / SCREENSHOT_H }}
    >
      <div
        className="absolute -inset-8 -z-10 rounded-[72px] blur-3xl"
        style={{ backgroundColor: `${accent}26` }}
      />
      <div className="relative size-full overflow-hidden rounded-[46px] border-[9px] border-zinc-900 bg-zinc-900 shadow-[0_50px_90px_-25px_rgba(0,0,0,0.35)]">
        <div className="absolute top-0 left-1/2 z-10 h-[22px] w-[104px] -translate-x-1/2 rounded-b-2xl bg-zinc-900" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          className="size-full object-cover"
          style={{ aspectRatio: `${SCREENSHOT_W} / ${SCREENSHOT_H}` }}
        />
      </div>
    </div>
  )
}

export function ScreenshotCoverWide({
  headline,
  subtitle,
  screenshot,
  accent,
}: {
  headline: string
  subtitle: string
  screenshot: string
  accent: string
}) {
  return (
    <div
      dir="rtl"
      className="relative flex size-full items-center justify-between overflow-hidden bg-white px-[110px] font-sans"
    >
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 55% 90% at 100% 50%, ${accent}20, transparent 65%), radial-gradient(ellipse 40% 60% at 8% 90%, ${accent}16, transparent 60%)`,
        }}
      />
      <CurvedAccent color={accent} />

      <div className="relative z-10 flex max-w-[820px] flex-col items-start gap-7">
        <div className="flex items-center gap-2.5">
          <span
            className="icon-[lucide--route] size-7"
            style={{ color: accent }}
          />
          <span className="font-heading text-[28px] font-bold tracking-tight text-zinc-900">
            TehGo
          </span>
        </div>

        <h1 className="text-right font-heading text-[68px] leading-[1.25] font-extrabold text-zinc-900">
          {headline}
        </h1>
        <p className="max-w-[680px] text-right text-[30px] leading-[1.6] text-pretty text-zinc-500">
          {subtitle}
        </p>
      </div>

      <div className="relative z-10 shrink-0">
        <PhoneMockup src={screenshot} accent={accent} />
      </div>
    </div>
  )
}

export function makeScreenshotCoverWide(
  props: Parameters<typeof ScreenshotCoverWide>[0]
): ComponentType {
  function TehgoScreenshotCoverWide() {
    return <ScreenshotCoverWide {...props} />
  }
  return TehgoScreenshotCoverWide
}
