"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"

const THEME_CHANNEL = "ui_theme_sync"

function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      <ThemeHotkey />
      <ThemeSync />
      {children}
    </NextThemesProvider>
  )
}

function ThemeSync() {
  const { resolvedTheme, setTheme } = useTheme()
  const channelRef = React.useRef<BroadcastChannel | null>(null)
  const fromBroadcastRef = React.useRef(false)

  React.useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return

    const ch = new BroadcastChannel(THEME_CHANNEL)
    channelRef.current = ch

    ch.addEventListener("message", (e: MessageEvent) => {
      const data = e.data as { type: string; theme: string }
      if (data?.type === "theme_change" && data.theme) {
        fromBroadcastRef.current = true
        setTheme(data.theme)
      }
    })

    return () => {
      ch.close()
      channelRef.current = null
    }
  }, [setTheme])

  React.useEffect(() => {
    if (fromBroadcastRef.current) {
      fromBroadcastRef.current = false
      return
    }
    if (resolvedTheme && channelRef.current) {
      channelRef.current.postMessage({ type: "theme_change", theme: resolvedTheme })
    }
  }, [resolvedTheme])

  return null
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  )
}

function ThemeHotkey() {
  const { resolvedTheme, setTheme } = useTheme()

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat) {
        return
      }

      if (event.metaKey || event.ctrlKey || event.altKey) {
        return
      }

      if (event?.key?.toLowerCase() !== "t") {
        return
      }

      if (isTypingTarget(event.target)) {
        return
      }

      setTheme(resolvedTheme === "dark" ? "light" : "dark")
    }

    window.addEventListener("keydown", onKeyDown)

    return () => {
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [resolvedTheme, setTheme])

  return null
}

export { ThemeProvider }
