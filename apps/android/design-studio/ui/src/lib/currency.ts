/** Converts Iranian Rial (IRR) to Toman (IRT) by dividing by 10 and flooring the absolute value. */
export function toIRT(irr: number): number {
  return Math.floor(Math.abs(irr) / 10)
}

/** Formats a Toman amount as a Persian-locale string with the "تومان" suffix. Handles zero explicitly. */
export function formatToman(irt: number): string {
  if (irt === 0) return "۰ تومان"
  return irt.toLocaleString("fa-IR") + " تومان"
}

/** Converts IRR to IRT and formats as Toman display string. */
export function formatIRR(irr: number): string {
  return formatToman(toIRT(irr))
}

/** Formats a number with Persian locale and compact "ت" (Toman) suffix for space-constrained contexts. */
export function formatPrice(n: number): string {
  return new Intl.NumberFormat("fa-IR").format(n) + " ت"
}

/** Formats a large IRR amount compactly: milliards, millions, thousands, or raw Persian digits. */
export function formatCompactToman(irr: number | string): string {
  const t = Math.floor(Number(irr) / 10)
  if (t >= 1_000_000_000) return `${(t / 1_000_000_000).toFixed(1)} میلیارد`
  if (t >= 1_000_000) return `${(t / 1_000_000).toFixed(1)} میلیون`
  if (t >= 1_000) return `${(t / 1_000).toFixed(0)} هزار`
  return t.toLocaleString("fa-IR")
}
