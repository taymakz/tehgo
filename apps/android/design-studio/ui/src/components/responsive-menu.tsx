"use client"

import * as React from "react"
import { useIsMobile } from "@workspace/ui/hooks/use-media-query"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  Drawer,
  DrawerClose,
  DrawerMenu,
  DrawerMenuGroup,
  DrawerMenuGroupLabel,
  DrawerMenuItem,
  DrawerMenuSeparator,
  DrawerPanel,
  DrawerPopup,
  DrawerTrigger,
} from "@workspace/ui/components/drawer"

// ─── Context ──────────────────────────────────────────────────────────────────

type ResponsiveMenuContextValue = { isDesktop: boolean }

const ResponsiveMenuContext =
  React.createContext<ResponsiveMenuContextValue | null>(null)

function useResponsiveMenuContext() {
  const ctx = React.useContext(ResponsiveMenuContext)
  if (!ctx)
    throw new Error(
      "ResponsiveMenu components must be used within <ResponsiveMenu>"
    )
  return ctx
}

// ─── Root ─────────────────────────────────────────────────────────────────────

type ResponsiveMenuProps = {
  children: React.ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

function ResponsiveMenu({
  children,
  open,
  defaultOpen,
  onOpenChange,
}: ResponsiveMenuProps) {
  const isDesktop = !useIsMobile()

  return (
    <ResponsiveMenuContext.Provider value={{ isDesktop }}>
      {isDesktop ? (
        <DropdownMenu
          open={open}
          defaultOpen={defaultOpen}
          onOpenChange={onOpenChange}
        >
          {children}
        </DropdownMenu>
      ) : (
        <Drawer
          open={open}
          defaultOpen={defaultOpen}
          onOpenChange={onOpenChange}
        >
          {children}
        </Drawer>
      )}
    </ResponsiveMenuContext.Provider>
  )
}

// ─── Trigger ─────────────────────────────────────────────────────────────────

type ResponsiveMenuTriggerProps = React.ComponentProps<
  typeof DropdownMenuTrigger
>

function ResponsiveMenuTrigger(props: ResponsiveMenuTriggerProps) {
  const { isDesktop } = useResponsiveMenuContext()
  return isDesktop ? (
    <DropdownMenuTrigger {...props} />
  ) : (
    <DrawerTrigger {...(props as React.ComponentProps<typeof DrawerTrigger>)} />
  )
}

// ─── Content ─────────────────────────────────────────────────────────────────

type ResponsiveMenuContentProps = {
  children: React.ReactNode
  groupLabel?: string
  align?: React.ComponentProps<typeof DropdownMenuContent>["align"]
  side?: React.ComponentProps<typeof DropdownMenuContent>["side"]
  sideOffset?: number
  className?: string
}

function ResponsiveMenuContent({
  children,
  groupLabel,
  align = "end",
  side = "bottom",
  sideOffset = 4,
  className,
}: ResponsiveMenuContentProps) {
  const { isDesktop } = useResponsiveMenuContext()

  if (isDesktop) {
    return (
      <DropdownMenuContent
        align={align}
        side={side}
        sideOffset={sideOffset}
        className={className}
      >
        <DropdownMenuGroup>
          {groupLabel && <DropdownMenuLabel>{groupLabel}</DropdownMenuLabel>}
          {children}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    )
  }

  return (
    <DrawerPopup showBar>
      <DrawerPanel>
        <DrawerMenu>
          <DrawerMenuGroup>
            {groupLabel && (
              <DrawerMenuGroupLabel>{groupLabel}</DrawerMenuGroupLabel>
            )}
            {children}
          </DrawerMenuGroup>
        </DrawerMenu>
      </DrawerPanel>
    </DrawerPopup>
  )
}

// ─── Item ─────────────────────────────────────────────────────────────────────

type ResponsiveMenuItemProps = {
  children: React.ReactNode
  onClick?: () => void
  variant?: "default" | "destructive"
  disabled?: boolean
}

function ResponsiveMenuItem({
  children,
  onClick,
  variant = "default",
  disabled,
}: ResponsiveMenuItemProps) {
  const { isDesktop } = useResponsiveMenuContext()

  if (isDesktop) {
    return (
      <DropdownMenuItem variant={variant} disabled={disabled} onClick={onClick}>
        {children}
      </DropdownMenuItem>
    )
  }

  return (
    <DrawerClose
      render={<DrawerMenuItem variant={variant} disabled={disabled} />}
      onClick={onClick}
    >
      {children}
    </DrawerClose>
  )
}

// ─── Separator ────────────────────────────────────────────────────────────────

function ResponsiveMenuSeparator() {
  const { isDesktop } = useResponsiveMenuContext()
  return isDesktop ? <DropdownMenuSeparator /> : <DrawerMenuSeparator />
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export {
  ResponsiveMenu,
  ResponsiveMenuTrigger,
  ResponsiveMenuContent,
  ResponsiveMenuItem,
  ResponsiveMenuSeparator,
}
