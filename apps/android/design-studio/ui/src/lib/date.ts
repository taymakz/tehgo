/** Formats an ISO date string as a long Persian date (e.g. "۱۴۰۴ خرداد ۱۲"). Returns "—" for null/undefined. */
export function formatDate(d: string | null | undefined): string {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" })
}

/** Formats an ISO date string as a short Persian date (e.g. "۱۴۰۴/۳/۱۲"). Returns "—" for null/undefined. */
export function formatDateShort(d: string | null | undefined): string {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("fa-IR")
}

/** Returns "امروز", "دیروز", or a short Persian date string for the given ISO date. */
export function dateLabel(isoString: string): string {
  const d = new Date(isoString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return "امروز"
  if (d.toDateString() === yesterday.toDateString()) return "دیروز"
  return d.toLocaleDateString("fa-IR")
}
