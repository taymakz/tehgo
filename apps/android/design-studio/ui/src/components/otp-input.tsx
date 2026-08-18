"use client"

import type { RefObject } from "react"
import type * as React from "react"

import { cn } from "@workspace/ui/lib/utils"
import { OTPField, OTPFieldInput } from "@workspace/ui/components/otp-field"

type OTPInputProps = {
  length: number
  value: string
  onValueChange: (value: string) => void
  disabled?: boolean
  inputRef?: RefObject<HTMLInputElement | null>
  variant?: "numeric" | "backup"
  size?: "default" | "lg"
  className?: string
  inputClassName?: string
  "aria-label"?: string
}

function OTPInput({
  length,
  value,
  onValueChange,
  disabled,
  inputRef,
  variant = "numeric",
  size = "lg",
  className,
  inputClassName,
  ...props
}: OTPInputProps) {
  const isBackup = variant === "backup"

  const defaultInputClassName = isBackup
    ? "size-14 border sm:size-12! first:rounded-l-md last:rounded-r-md rounded-none"
    : "size-14 rounded-xl border sm:size-12!"

  return (
    <OTPField
      length={length}
      value={value}
      onValueChange={onValueChange}
      validationType={isBackup ? "alphanumeric" : "numeric"}
      inputMode={isBackup ? "text" : "numeric"}
      size={size}
      disabled={disabled}
      className={cn(isBackup ? "gap-0" : "gap-4", className)}
      {...props}
    >
      {Array.from({ length }).map((_, i) => (
        <OTPFieldInput
          key={i}
          ref={i === 0 ? inputRef : undefined}
          aria-label={`کاراکتر ${i + 1} از ${length}`}
          autoComplete="one-time-code"
          className={inputClassName ?? defaultInputClassName}
        />
      ))}
    </OTPField>
  )
}

export { OTPInput }
export type { OTPInputProps }
