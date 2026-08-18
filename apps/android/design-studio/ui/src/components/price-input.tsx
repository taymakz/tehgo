"use client"

import * as React from "react"
import { Input } from "@workspace/ui/components/input"

function toDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, "")
  if (!digits) return ""
  return Number(digits).toLocaleString("en-US")
}

export interface PriceInputProps
  extends Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> {
  value: string
  onChange: (digits: string) => void
}

export function PriceInput({ value, onChange, placeholder = "0", className, ...props }: PriceInputProps) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(e.target.value.replace(/\D/g, ""))
  }

  return (
    <Input
      {...props}
      type="text"
      inputMode="numeric"
      dir="ltr"
      value={toDisplay(value)}
      onChange={handleChange}
      placeholder={placeholder}
      className={`font-mono ${className ?? ""}`}
    />
  )
}
