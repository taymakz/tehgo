"use client"

import type { ComponentProps } from "react"
import * as React from "react"
import { AnimatePresence, motion } from "motion/react"
import { CheckIcon, CopyIcon, XCircleIcon } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import type { CopyState } from "@workspace/ui/hooks/use-copy-to-clipboard"
import { useCopyToClipboard } from "@workspace/ui/hooks/use-copy-to-clipboard"
import { Button } from "@workspace/ui/components/button"
import { anchoredToastManager } from "@workspace/ui/components/toast"
import {
  Tooltip,
  TooltipPopup,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"

function IconSwap({ children }: React.PropsWithChildren) {
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      {children}
    </AnimatePresence>
  )
}

function IconSwapItem({
  className,
  ...props
}: React.ComponentProps<typeof motion.span>) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
      transition={{ type: "spring", duration: 0.3, bounce: 0 }}
      className={cn("flex items-center justify-center", className)}
      {...props}
    />
  )
}

export type CopyStateIconProps = {
  state: CopyState
  idleIcon?: React.ReactNode
  doneIcon?: React.ReactNode
  errorIcon?: React.ReactNode
}

export function CopyStateIcon({
  state,
  idleIcon,
  doneIcon,
  errorIcon,
}: CopyStateIconProps) {
  return (
    <IconSwap>
      <IconSwapItem key={state}>
        {state === "idle" && (idleIcon ?? <CopyIcon className="size-4" />)}
        {state === "done" && (doneIcon ?? <CheckIcon className="size-4" />)}
        {state === "error" && (errorIcon ?? <XCircleIcon className="size-4" />)}
      </IconSwapItem>
    </IconSwap>
  )
}

export type CopyButtonProps = ComponentProps<typeof Button> & {
  text: string | (() => string)
  label?: string
  onCopySuccess?: (text: string) => void
  onCopyError?: (error: Error) => void
  idleIcon?: React.ReactNode
  doneIcon?: React.ReactNode
  errorIcon?: React.ReactNode
}

export function CopyButton({
  className,
  size = "icon",
  children,
  text,
  label = "کپی",
  idleIcon,
  doneIcon,
  errorIcon,
  onClick,
  onCopySuccess,
  onCopyError,
  ...props
}: CopyButtonProps) {
  const ref = React.useRef<HTMLButtonElement>(null)
  const toastTimeout = 2000

  const { state, copy } = useCopyToClipboard({
    resetDelay: toastTimeout,
    onCopySuccess: (copied) => {
      if (ref.current) {
        anchoredToastManager.add({
          title: "کپی شد!",
          timeout: toastTimeout,
          data: { tooltipStyle: true },
          positionerProps: { anchor: ref.current },
        })
      }
      onCopySuccess?.(copied)
    },
    onCopyError: (error) => {
      if (ref.current) {
        anchoredToastManager.add({
          title: "خطا در کپی",
          type: "error",
          timeout: toastTimeout,
          data: { tooltipStyle: true },
          positionerProps: { anchor: ref.current },
        })
      }
      onCopyError?.(error)
    },
  })

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            ref={ref}
            className={cn("will-change-transform", className)}
            size={size}
            aria-label={label}
            onClick={(e) => {
              copy(text)
              onClick?.(e)
            }}
            {...props}
          />
        }
      >
        <CopyStateIcon
          state={state}
          idleIcon={idleIcon}
          doneIcon={doneIcon}
          errorIcon={errorIcon}
        />
        {children}
      </TooltipTrigger>

      <TooltipPopup>
        <p>{label}</p>
      </TooltipPopup>
    </Tooltip>
  )
}
