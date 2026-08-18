"use client"

import * as React from "react"
import { EyeIcon, EyeOffIcon } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"
import { type InputProps } from "@workspace/ui/components/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@workspace/ui/components/input-group"
import { Button } from "@workspace/ui/components/button"
type PasswordInputProps = Omit<InputProps, "type">

function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [showPassword, setShowPassword] = React.useState(false)

  return (
    <InputGroup className={cn("h-auto", className)}>
      <InputGroupInput {...props} type={showPassword ? "text" : "password"} />
      <InputGroupAddon align="inline-start">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={showPassword ? "مخفی کردن رمز عبور" : "نمایش رمز عبور"}
          onClick={() => setShowPassword((v) => !v)}
        >
          {showPassword ? (
            <EyeOffIcon className="size-4" aria-hidden="true" />
          ) : (
            <EyeIcon className="size-4" aria-hidden="true" />
          )}
        </Button>
      </InputGroupAddon>
    </InputGroup>
  )
}

export { PasswordInput }
export type { PasswordInputProps }
