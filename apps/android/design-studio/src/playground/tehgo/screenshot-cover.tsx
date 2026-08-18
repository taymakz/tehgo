import type { ComponentType } from "react"

// Marketing template for TehGo's own app screenshots — big Persian headline,
// short subtitle, soft accent-tinted gradient, phone mockup with a real
// screenshot inside. Styled after ride-hailing-app store graphics (bold
// headline over a light gradient, decorative curved accent line, phone
// centered in the lower ~60% of the frame). One accent color per slide,
// pulled straight from TehGo's own metro line palette so each card visually
// ties back to a real line on the map instead of an arbitrary brand color.

const SCREENSHOT_W = 578
const SCREENSHOT_H = 1280

function CurvedAccent({ color }: { color: string }) {
  return (
    <svg
      className="pointer-events-none absolute top-[100px] -left-[70px] opacity-80"
      width="340"
      height="460"
      viewBox="0 0 340 460"
      fill="none"
    >
      <path
        d="M -20 30 C 110 10, 150 130, 70 210 S 30 380, 190 430"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity="0.55"
      />
      <circle
        cx="190"
        cy="430"
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
      style={{ height: 830, width: (830 * SCREENSHOT_W) / SCREENSHOT_H }}
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

export function ScreenshotCover({
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
      className="relative flex size-full flex-col items-center overflow-hidden bg-white pt-[76px] font-sans"
    >
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 90% 55% at 50% 100%, ${accent}20, transparent 65%), radial-gradient(ellipse 60% 36% at 12% 4%, ${accent}16, transparent 60%)`,
        }}
      />
      <CurvedAccent color={accent} />

      <div className="relative z-10 mb-7 flex items-center gap-2.5">
        <span
          className="icon-[lucide--route] size-7"
          style={{ color: accent }}
        />
        <span className="font-heading text-[28px] font-bold tracking-tight text-zinc-900">
          TehGo
        </span>
      </div>

      <h1 className="relative z-10 max-w-[920px] text-center font-heading text-[76px] leading-[1.22] font-extrabold text-zinc-900">
        {headline}
      </h1>
      <p className="relative z-10 mt-5 max-w-[700px] text-center text-[31px] leading-[1.6] text-pretty text-zinc-500">
        {subtitle}
      </p>

      <div className="relative z-10 mt-10">
        <PhoneMockup src={screenshot} accent={accent} />
      </div>
    </div>
  )
}

export function makeScreenshotCover(
  props: Parameters<typeof ScreenshotCover>[0]
): ComponentType {
  function TehgoScreenshotCover() {
    return <ScreenshotCover {...props} />
  }
  return TehgoScreenshotCover
}
