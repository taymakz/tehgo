"use client"

import * as React from "react"

import { cn } from "@workspace/ui/lib/utils"
import { useIsMobile } from "@workspace/ui/hooks/use-media-query"
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerPanel,
  DrawerPopup,
  DrawerTitle,
  DrawerTrigger,
} from "@workspace/ui/components/drawer"

type ResponsiveDialogContextValue = {
  isDesktop: boolean
}

const ResponsiveDialogContext =
  React.createContext<ResponsiveDialogContextValue | null>(null)

function useResponsiveDialogContext() {
  const context = React.useContext(ResponsiveDialogContext)

  if (!context) {
    throw new Error(
      "ResponsiveDialog components must be used within <ResponsiveDialog>"
    )
  }

  return context
}

type ResponsiveDialogProps = {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
  drawerPosition?: "right" | "left" | "top" | "bottom"
  /**
   * Forwarded to the underlying Dialog/Drawer root. Leave at the default
   * (full modal) for a top-level dialog; pass `"trap-focus"` when this
   * dialog is rendered *inside* another already-open modal Dialog/Drawer
   * (e.g. a confirm step nested in a drawer) — the outer one already owns
   * the page-level scroll lock/inert, so the inner one should only trap
   * focus, not re-apply document-wide modal behavior on top of it.
   */
  modal?: boolean | "trap-focus"
}

function ResponsiveDialog({
  open,
  defaultOpen,
  onOpenChange,
  children,
  drawerPosition = "bottom",
  modal,
}: ResponsiveDialogProps) {
  const isMobile = useIsMobile()
  const isDesktop = !isMobile

  const contextValue = React.useMemo(() => ({ isDesktop }), [isDesktop])

  return (
    <ResponsiveDialogContext.Provider value={contextValue}>
      {isDesktop ? (
        <Dialog
          open={open}
          defaultOpen={defaultOpen}
          onOpenChange={onOpenChange}
          modal={modal}
        >
          {children}
        </Dialog>
      ) : (
        <Drawer
          open={open}
          defaultOpen={defaultOpen}
          onOpenChange={onOpenChange}
          position={drawerPosition}
          modal={modal}
        >
          {children}
        </Drawer>
      )}
    </ResponsiveDialogContext.Provider>
  )
}

type ResponsiveDialogTriggerProps =
  | React.ComponentProps<typeof DialogTrigger>
  | React.ComponentProps<typeof DrawerTrigger>

function ResponsiveDialogTrigger(props: ResponsiveDialogTriggerProps) {
  const { isDesktop } = useResponsiveDialogContext()

  return isDesktop ? (
    <DialogTrigger {...(props as React.ComponentProps<typeof DialogTrigger>)} />
  ) : (
    <DrawerTrigger {...(props as React.ComponentProps<typeof DrawerTrigger>)} />
  )
}

type ResponsiveDialogCloseProps =
  | React.ComponentProps<typeof DialogClose>
  | React.ComponentProps<typeof DrawerClose>

function ResponsiveDialogClose(props: ResponsiveDialogCloseProps) {
  const { isDesktop } = useResponsiveDialogContext()

  return isDesktop ? (
    <DialogClose {...(props as React.ComponentProps<typeof DialogClose>)} />
  ) : (
    <DrawerClose {...(props as React.ComponentProps<typeof DrawerClose>)} />
  )
}

type ResponsiveDialogPopupProps = Omit<
  React.ComponentProps<typeof DialogPopup>,
  "className"
> & {
  className?: React.ComponentProps<typeof DialogPopup>["className"]
  drawerClassName?: React.ComponentProps<typeof DrawerPopup>["className"]
}

function ResponsiveDialogPopup({
  className,
  drawerClassName,
  closeProps,
  portalProps,
  showCloseButton,
  bottomStickOnMobile,
  ...props
}: ResponsiveDialogPopupProps) {
  const { isDesktop } = useResponsiveDialogContext()

  if (isDesktop) {
    return (
      <DialogPopup
        {...(props as React.ComponentProps<typeof DialogPopup>)}
        className={className}
        closeProps={closeProps}
        portalProps={portalProps}
        showCloseButton={showCloseButton}
        bottomStickOnMobile={bottomStickOnMobile}
      />
    )
  }

  return (
    <DrawerPopup
      {...(props as React.ComponentProps<typeof DrawerPopup>)}
      className={drawerClassName}
    />
  )
}

type ResponsiveDialogPanelProps = Omit<
  React.ComponentProps<typeof DialogPanel>,
  "className"
> & {
  className?: React.ComponentProps<typeof DialogPanel>["className"]
  drawerClassName?: React.ComponentProps<typeof DrawerPanel>["className"]
}

function ResponsiveDialogPanel({
  className,
  drawerClassName,
  ...props
}: ResponsiveDialogPanelProps) {
  const { isDesktop } = useResponsiveDialogContext()

  if (isDesktop) {
    return (
      <DialogPanel
        {...(props as React.ComponentProps<typeof DialogPanel>)}
        className={className}
      />
    )
  }

  // Mobile renders a Drawer, which wraps panel content in a ScrollArea +
  // DrawerContent. Layout utilities like `space-y-*` belong on the content and
  // must apply on both surfaces, so `className` flows to mobile too; pass
  // `drawerClassName` only for genuinely mobile-specific overrides (it wins via
  // tailwind-merge). Without this, a panel with only `className="space-y-4"`
  // silently loses its spacing inside the drawer.
  return (
    <DrawerPanel
      {...(props as React.ComponentProps<typeof DrawerPanel>)}
      className={cn(className, drawerClassName)}
    />
  )
}

type ResponsiveDialogHeaderProps = Omit<
  React.ComponentProps<typeof DialogHeader>,
  "className"
> & {
  className?: React.ComponentProps<typeof DialogHeader>["className"]
  drawerClassName?: React.ComponentProps<typeof DrawerHeader>["className"]
}

function ResponsiveDialogHeader({
  className,
  drawerClassName,
  ...props
}: ResponsiveDialogHeaderProps) {
  const { isDesktop } = useResponsiveDialogContext()

  if (isDesktop) {
    return (
      <DialogHeader
        {...(props as React.ComponentProps<typeof DialogHeader>)}
        className={className}
      />
    )
  }

  return (
    <DrawerHeader
      {...(props as React.ComponentProps<typeof DrawerHeader>)}
      className={drawerClassName}
    />
  )
}

type ResponsiveDialogFooterProps = Omit<
  React.ComponentProps<typeof DialogFooter>,
  "className"
> & {
  className?: React.ComponentProps<typeof DialogFooter>["className"]
  drawerClassName?: React.ComponentProps<typeof DrawerFooter>["className"]
}

function ResponsiveDialogFooter({
  className,
  drawerClassName,
  ...props
}: ResponsiveDialogFooterProps) {
  const { isDesktop } = useResponsiveDialogContext()

  if (isDesktop) {
    return (
      <DialogFooter
        {...(props as React.ComponentProps<typeof DialogFooter>)}
        className={className}
      />
    )
  }

  return (
    <DrawerFooter
      {...(props as React.ComponentProps<typeof DrawerFooter>)}
      className={drawerClassName}
    />
  )
}

type ResponsiveDialogTitleProps = Omit<
  React.ComponentProps<typeof DialogTitle>,
  "className"
> & {
  className?: React.ComponentProps<typeof DialogTitle>["className"]
  drawerClassName?: React.ComponentProps<typeof DrawerTitle>["className"]
}

function ResponsiveDialogTitle({
  className,
  drawerClassName,
  ...props
}: ResponsiveDialogTitleProps) {
  const { isDesktop } = useResponsiveDialogContext()

  if (isDesktop) {
    return (
      <DialogTitle
        {...(props as React.ComponentProps<typeof DialogTitle>)}
        className={className}
      />
    )
  }

  return (
    <DrawerTitle
      {...(props as React.ComponentProps<typeof DrawerTitle>)}
      className={drawerClassName}
    />
  )
}

type ResponsiveDialogDescriptionProps = Omit<
  React.ComponentProps<typeof DialogDescription>,
  "className"
> & {
  className?: React.ComponentProps<typeof DialogDescription>["className"]
  drawerClassName?: React.ComponentProps<typeof DrawerDescription>["className"]
}

function ResponsiveDialogDescription({
  className,
  drawerClassName,
  ...props
}: ResponsiveDialogDescriptionProps) {
  const { isDesktop } = useResponsiveDialogContext()

  if (isDesktop) {
    return (
      <DialogDescription
        {...(props as React.ComponentProps<typeof DialogDescription>)}
        className={className}
      />
    )
  }

  return (
    <DrawerDescription
      {...(props as React.ComponentProps<typeof DrawerDescription>)}
      className={drawerClassName}
    />
  )
}

/**
 * Renders children on desktop only. On mobile the dialog is a bottom drawer that
 * users dismiss by swiping down, so a Cancel/انصراف button is redundant.
 *
 * Convention: wrap every Cancel/انصراف action in this so it shows on desktop
 * only; keep the confirm/primary action outside so it stays on both. The footer
 * is flex, so the lone primary button fills the width — avoid `grid-cols-2`.
 */
function ResponsiveDialogDesktopOnly({
  children,
}: {
  children: React.ReactNode
}) {
  const { isDesktop } = useResponsiveDialogContext()
  if (!isDesktop) return null
  return <>{children}</>
}

export {
  ResponsiveDialog,
  ResponsiveDialogTrigger,
  ResponsiveDialogClose,
  ResponsiveDialogPopup,
  ResponsiveDialogPanel,
  ResponsiveDialogHeader,
  ResponsiveDialogFooter,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
  ResponsiveDialogDesktopOnly,
}
