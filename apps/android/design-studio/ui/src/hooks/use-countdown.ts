"use client"

import * as React from "react"

export type CountdownResult = {
  hours: number
  minutes: number
  seconds: number
  totalSeconds: number
  isOverdue: boolean
  formatted: string
}

export function useCountdown(targetIso: string | null): CountdownResult | null {
  const [result, setResult] = React.useState<CountdownResult | null>(null)

  React.useEffect(() => {
    if (!targetIso) {
      setResult(null)
      return
    }

    function compute() {
      const diff = Math.round(
        (new Date(targetIso!).getTime() - Date.now()) / 1000
      )
      const isOverdue = diff < 0
      const abs = Math.abs(diff)
      const h = Math.floor(abs / 3600)
      const m = Math.floor((abs % 3600) / 60)
      const s = abs % 60
      const pad = (n: number) => String(n).padStart(2, "0")
      setResult({
        hours: h,
        minutes: m,
        seconds: s,
        totalSeconds: diff,
        isOverdue,
        formatted: `${pad(h)}:${pad(m)}:${pad(s)}`,
      })
    }

    compute()
    const id = setInterval(compute, 1000)
    return () => clearInterval(id)
  }, [targetIso])

  return result
}
