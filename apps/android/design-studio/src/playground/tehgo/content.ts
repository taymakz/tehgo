// Single source of truth for the TehGo marketing copy — shared by both the
// portrait Instagram-post layout (screenshot-cover.tsx) and the 16:9
// Myket/Cafebazaar landscape cover layout (screenshot-cover-wide.tsx), so
// the two variants never drift out of sync with each other.

// Accent colors lifted directly from TehGo's own metro line palette (see the
// "خطوط" list screenshot) so each marketing card ties back to a real line on
// the map instead of an arbitrary brand color.
const LINE = {
  1: "#ef4444", // خط ۱ — red
  2: "#1d4ed8", // خط ۲ — navy
  3: "#38bdf8", // خط ۳ — sky blue
  5: "#059669", // خط ۵ — green (Karaj)
  7: "#7e22ce", // خط ۷ — purple
} as const

export type TehgoSlideContent = {
  headline: string
  subtitle: string
  screenshot: string
  accent: string
}

export const tehgoSlides = {
  home: {
    headline: "مسیریابی متروی تهران و کرج",
    subtitle: "سریع‌ترین مسیر بین هر دو ایستگاه، فقط با یک لمس",
    screenshot: "/screen-shots/photo_7_2026-07-17_11-21-17.jpg",
    accent: LINE[2],
  },
  routeDetail: {
    headline: "جزئیات کامل هر قدم از مسیر",
    subtitle: "خط، ایستگاه و تعویض؛ همه در یک نگاه ساده",
    screenshot: "/screen-shots/photo_8_2026-07-17_11-21-17.jpg",
    accent: LINE[7],
  },
  showOnMap: {
    headline: "مسیرت رو روی نقشه ببین",
    subtitle: "مسیر گام‌به‌گام روی نقشه واقعی شهر",
    screenshot: "/screen-shots/photo_9_2026-07-17_11-21-17.jpg",
    accent: LINE[3],
  },
  map: {
    headline: "نقشه کامل مترو تهران و کرج",
    subtitle: "همه خط‌ها و ایستگاه‌ها روی یک نقشه زنده",
    screenshot: "/screen-shots/photo_10_2026-07-17_11-21-17.jpg",
    accent: LINE[5],
  },
  lines: {
    headline: "هفت خط، یک اپلیکیشن",
    subtitle: "دسترسی سریع به تمام خطوط مترو تهران و کرج",
    screenshot: "/screen-shots/photo_1_2026-07-17_11-21-17.jpg",
    accent: LINE[1],
  },
  offline: {
    headline: "حتی آفلاین هم راهتو گم نمی‌کنی",
    subtitle: "نقشه کش‌شده یعنی کارکرد بدون اینترنت",
    screenshot: "/screen-shots/photo_6_2026-07-17_11-21-17.jpg",
    accent: "#27272a",
  },
} satisfies Record<string, TehgoSlideContent>
