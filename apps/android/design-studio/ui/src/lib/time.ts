/** Formats a duration in seconds as MM:SS (e.g. 90 → "1:30", 5 → "0:05"). Used for OTP/countdown display. */
export function formatSecondsToMMSS(totalSeconds: number): string {
  const seconds = Math.max(0, totalSeconds | 0)
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60
  const formattedSeconds = remainder < 10 ? `0${remainder}` : `${remainder}`
  return `${minutes}:${formattedSeconds}`
}

/** Returns a Persian-locale relative time string for a past date. Input can be ISO string or Date. */
export function fmtRelative(date: string | Date): string {
  const diff = (Date.now() - new Date(date).getTime()) / 1000
  if (diff < 60) return "همین لحظه"
  if (diff < 3600) return `${Math.floor(diff / 60)} دقیقه پیش`
  if (diff < 86400) return `${Math.floor(diff / 3600)} ساعت پیش`
  if (diff < 604800) return `${Math.floor(diff / 86400)} روز پیش`
  return new Date(date).toLocaleDateString("fa-IR")
}
