"use client"

import * as React from "react"

import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogDescription,
  ResponsiveDialogDesktopOnly,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogPanel,
  ResponsiveDialogPopup,
  ResponsiveDialogTitle,
} from "@workspace/ui/components/responsive-dialog"

type ConfirmTone = "destructive" | "warning" | "default"

const toneIconBox: Record<ConfirmTone, string> = {
  destructive: "bg-destructive/10 text-destructive",
  warning: "bg-amber-500/10 text-amber-600",
  default: "bg-muted text-foreground",
}

const toneToVariant: Record<
  ConfirmTone,
  React.ComponentProps<typeof Button>["variant"]
> = {
  destructive: "destructive",
  warning: "default",
  default: "default",
}

export interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Icon node rendered inside the tinted box. Iconify span or lucide component. */
  icon: React.ReactNode
  title: React.ReactNode
  /** Plain message. Use `children` instead for rich content or inputs. */
  description?: React.ReactNode
  /** Extra content (e.g. a reason textarea) rendered in the panel below `description`. */
  children?: React.ReactNode
  tone?: ConfirmTone
  confirmLabel: React.ReactNode
  /** Label shown while the action runs. Defaults to `confirmLabel`. */
  confirmingLabel?: React.ReactNode
  /** Optional leading icon inside the confirm button (e.g. a trash icon). */
  confirmIcon?: React.ReactNode
  cancelLabel?: React.ReactNode
  /** Override the confirm Button variant. Defaults from `tone`. */
  confirmVariant?: React.ComponentProps<typeof Button>["variant"]
  /** Extra classes for the confirm button (for custom-colored actions). */
  confirmClassName?: string
  /** Disable the confirm button beyond the loading state (e.g. a type-to-confirm gate). */
  confirmDisabled?: boolean
  /**
   * The action. If it returns a Promise, the dialog shows a spinner and disables
   * buttons until it settles, then closes on success (unless `closeOnConfirm` is false).
   * If you manage loading yourself, pass `loading` and a sync handler.
   */
  onConfirm: () => void | Promise<void>
  /** Controlled loading. When provided, the component does not manage its own. */
  loading?: boolean
  /** Close the dialog after a successful confirm. Default true. */
  closeOnConfirm?: boolean
  /** Override the popup width. Default `sm:max-w-sm`. */
  popupClassName?: string
  /**
   * Forwarded to the underlying Dialog/Drawer root. Pass `"trap-focus"` when
   * this confirm is nested inside another already-open modal Dialog/Drawer —
   * the outer one already owns the page-level scroll lock/inert, so the
   * inner one should only trap focus rather than re-apply modal behavior on
   * top of it.
   */
  modal?: boolean | "trap-focus"
  /** Portal target — pass the fullscreen element when the trigger lives
   *  inside content rendered via the real Fullscreen API, otherwise the
   *  dialog portals to `document.body` and is hidden by the browser. */
  portalContainer?: HTMLElement | null
}

export function ConfirmDialog({
  open,
  onOpenChange,
  icon,
  title,
  description,
  children,
  tone = "destructive",
  confirmLabel,
  confirmingLabel,
  confirmIcon,
  cancelLabel = "انصراف",
  confirmVariant,
  confirmClassName,
  confirmDisabled = false,
  onConfirm,
  loading: controlledLoading,
  closeOnConfirm = true,
  popupClassName,
  modal,
  portalContainer,
}: ConfirmDialogProps): React.ReactElement {
  const [internalLoading, setInternalLoading] = React.useState(false)
  const isControlled = controlledLoading !== undefined
  const loading = isControlled ? controlledLoading : internalLoading

  async function handleConfirm() {
    if (loading) return
    try {
      if (!isControlled) setInternalLoading(true)
      await onConfirm()
      if (closeOnConfirm) onOpenChange(false)
    } finally {
      if (!isControlled) setInternalLoading(false)
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} modal={modal}>
      <ResponsiveDialogPopup
        className={cn("sm:max-w-sm", popupClassName)}
        portalProps={
          portalContainer ? { container: portalContainer } : undefined
        }
      >
        <ResponsiveDialogHeader>
          <div
            className={cn(
              "mb-1 flex size-12 items-center justify-center rounded-2xl",
              toneIconBox[tone]
            )}
          >
            {icon}
          </div>
          <ResponsiveDialogTitle>{title}</ResponsiveDialogTitle>
          {description ? (
            <ResponsiveDialogDescription>
              {description}
            </ResponsiveDialogDescription>
          ) : null}
        </ResponsiveDialogHeader>

        {children ? (
          <ResponsiveDialogPanel>{children}</ResponsiveDialogPanel>
        ) : null}

        <ResponsiveDialogFooter>
          <ResponsiveDialogDesktopOnly>
            <ResponsiveDialogClose
              render={
                <Button variant="ghost" type="button" disabled={loading} />
              }
            >
              {cancelLabel}
            </ResponsiveDialogClose>
          </ResponsiveDialogDesktopOnly>
          <Button
            type="button"
            variant={confirmVariant ?? toneToVariant[tone]}
            disabled={loading || confirmDisabled}
            onClick={() => void handleConfirm()}
            className={cn("gap-2", confirmClassName)}
          >
            {loading ? <Spinner className="size-3.5" /> : confirmIcon}
            {loading ? (confirmingLabel ?? confirmLabel) : confirmLabel}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogPopup>
    </ResponsiveDialog>
  )
}
