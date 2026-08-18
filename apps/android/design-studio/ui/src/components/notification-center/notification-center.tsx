"use client"

import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"
import { Spinner } from "@workspace/ui/components/spinner"
import { fmtRelative } from "@workspace/ui/lib/time"
import type { SoundAsset } from "@workspace/ui/lib/sound-types"
import { DynamicIsland, DynamicIslandView } from "./dynamic-island"
import { useSound } from "./use-sound"
import type {
  AppNotification,
  NotificationsStoreHook,
  ServerNotification,
} from "./store"

// ─── Adapter ──────────────────────────────────────────────────────────────────

/**
 * Everything app-specific about the notification center, injected by each
 * app's thin `notification-bell.tsx` wrapper. Build the adapter at MODULE
 * scope (services/stores are singletons) so hook identities stay stable.
 */
export interface NotificationCenterAdapter {
  /** The app's store instance from `createNotificationsStore()`. */
  store: NotificationsStoreHook
  /** Fetch one page of server notifications (already unwrapped to rows). */
  list: (page: number, limit: number) => Promise<ServerNotification[]>
  /** Persist a single-row read; the store is updated optimistically first. */
  markRead: (id: string) => Promise<unknown>
  /** Persist mark-all-read (header action). */
  markAllRead: () => Promise<unknown>
  /** Persist archive-all (header clear action). */
  archiveAll: () => Promise<unknown>
  /**
   * Optional renderer for MEMBER_INVITATION rows (panel only — accept/decline
   * actions live in the app because they call app services). When absent,
   * invitation rows render as plain server rows (website behavior).
   */
  renderInvitation?: (
    notif: ServerNotification,
    onRead: (id: string) => void,
    refetch: () => void
  ) => React.ReactNode
  /** Sound played when the unread badge increases (per-app asset). */
  sound: SoundAsset
}

// ─── Live clock ───────────────────────────────────────────────────────────────

function useClock() {
  const fmt = () => {
    const now = new Date()
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
  }
  const [time, setTime] = React.useState("")

  React.useEffect(() => {
    setTime(fmt())
    const now = new Date()
    const msToNext = (60 - now.getSeconds()) * 1000 - now.getMilliseconds()
    let interval: ReturnType<typeof setInterval>
    const timeout = setTimeout(() => {
      setTime(fmt())
      interval = setInterval(() => setTime(fmt()), 60_000)
    }, msToNext)
    return () => {
      clearTimeout(timeout)
      clearInterval(interval)
    }
  }, [])

  return time
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const NOTIF_DOT: Record<AppNotification["type"], string> = {
  success: "bg-emerald-400",
  error: "bg-rose-400",
  warning: "bg-amber-400",
  info: "bg-sky-400",
}

// ─── Row components ────────────────────────────────────────────────────────────

function MemoryNotifRow({ notif }: { notif: AppNotification }) {
  return (
    <div
      className={cn(
        "flex gap-2.5 rounded-xl px-3 py-2.5",
        !notif.read && "bg-foreground/8"
      )}
    >
      <span
        className={cn(
          "mt-1.5 size-1.5 shrink-0 rounded-full",
          !notif.read ? NOTIF_DOT[notif.type] : "bg-foreground/25"
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="text-[12px] leading-snug font-medium text-foreground/90">
          {notif.title}
        </p>
        {notif.description && (
          <p className="mt-0.5 text-[11px] leading-relaxed text-foreground/55">
            {notif.description}
          </p>
        )}
        <p className="mt-1 text-[10px] text-foreground/35">
          {fmtRelative(notif.timestamp)}
        </p>
      </div>
    </div>
  )
}

function ServerNotifRow({
  notif,
  onRead,
}: {
  notif: ServerNotification
  onRead: (id: string) => void
}) {
  return (
    <div
      onClick={() => {
        if (!notif.isRead) onRead(notif.id)
      }}
      className={cn(
        "flex cursor-pointer gap-2.5 rounded-xl px-3 py-2.5 transition-colors",
        notif.isRead
          ? "opacity-60 hover:opacity-80"
          : "bg-foreground/8 hover:bg-foreground/12"
      )}
    >
      {!notif.isRead && (
        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-sky-400" />
      )}
      <div className={cn("min-w-0 flex-1", notif.isRead && "ps-3.5")}>
        <p className="text-[12px] leading-snug font-medium text-foreground/90">
          {notif.title}
        </p>
        {notif.message && (
          <p className="mt-0.5 text-[11px] leading-relaxed text-foreground/55">
            {notif.message}
          </p>
        )}
        <p className="mt-1 text-[10px] text-foreground/35">
          {fmtRelative(new Date(notif.createdAt))}
        </p>
      </div>
    </div>
  )
}

// ─── Notification panel ────────────────────────────────────────────────────────

export function NotificationCenterPanel({
  adapter,
  onClose,
}: {
  adapter: NotificationCenterAdapter
  onClose: () => void
}) {
  const {
    notifications,
    unreadCount,
    markAllRead,
    clearAll,
    serverNotifs,
    serverNotifsLoaded,
    serverUnread,
    setServerNotifs,
    markServerNotifRead,
    markAllServerNotifsRead,
    clearServerNotifs,
  } = adapter.store()

  const [loading, setLoading] = React.useState(false)

  const fetchServerNotifs = React.useCallback(async () => {
    try {
      const rows = await adapter.list(1, 20)
      setServerNotifs(rows)
    } catch {
      /* ignore */
    }
  }, [adapter, setServerNotifs])

  // Fetch once if not yet loaded via WS
  React.useEffect(() => {
    if (serverNotifsLoaded) return
    setLoading(true)
    fetchServerNotifs().finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Rows mark themselves read individually on click — glancing at the bell
  // must never silently zero the unread state (the header's explicit
  // "mark all read" button still exists for that).
  const handleRowRead = React.useCallback(
    (id: string) => {
      markServerNotifRead(id)
      void adapter.markRead(id).catch(() => {})
    },
    [adapter, markServerNotifRead]
  )

  // With no invitation renderer (website), every server row — including
  // MEMBER_INVITATION — renders as a plain row, exactly as before extraction.
  const invitations = adapter.renderInvitation
    ? serverNotifs.filter((n) => n.type === "MEMBER_INVITATION")
    : []
  const otherServer = adapter.renderInvitation
    ? serverNotifs.filter((n) => n.type !== "MEMBER_INVITATION")
    : serverNotifs
  const totalUnread = unreadCount + serverUnread
  const isEmpty =
    invitations.length === 0 &&
    otherServer.length === 0 &&
    notifications.length === 0

  return (
    <div className="flex w-[280px] flex-col" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 pt-3 pb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-semibold text-foreground/90">
            اعلان‌ها
          </span>
          {totalUnread > 0 && (
            <span className="inline-flex min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 py-px text-[9px] leading-none font-bold text-white">
              {totalUnread > 99 ? "99+" : totalUnread}
            </span>
          )}
          {(unreadCount > 0 || serverUnread > 0) && (
            <button
              type="button"
              title="علامت‌گذاری همه به عنوان خوانده‌شده"
              onClick={() => {
                markAllRead()
                markAllServerNotifsRead()
                void adapter.markAllRead().catch(() => {})
              }}
              className="flex size-5 items-center justify-center rounded-md text-foreground/40 transition-colors hover:bg-foreground/10 hover:text-foreground/80"
            >
              <span className="icon-[lucide--check-check] size-3" />
            </button>
          )}
          {!isEmpty && (
            <button
              type="button"
              title="پاک کردن همه اعلان‌ها"
              onClick={() => {
                clearAll()
                clearServerNotifs()
                void adapter.archiveAll().catch(() => {})
              }}
              className="flex size-5 items-center justify-center rounded-md text-foreground/40 transition-colors hover:bg-foreground/10 hover:text-rose-400"
            >
              <span className="icon-[lucide--trash-2] size-3" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex size-6 items-center justify-center rounded-lg text-foreground/35 transition-colors hover:bg-foreground/10 hover:text-foreground/80"
        >
          <span className="icon-[lucide--x] size-3.5" />
        </button>
      </div>

      <div className="mx-3 border-t border-foreground/10" />

      {/* Content */}
      <div className="max-h-[420px] [scrollbar-width:thin] [scrollbar-color:theme(colors.foreground/20)_transparent] overflow-y-auto overscroll-contain">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="size-4 text-foreground/30" />
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center gap-2.5 py-9 text-center">
            <div className="flex size-9 items-center justify-center rounded-full bg-foreground/8">
              <span className="icon-[lucide--bell-off] size-4 text-foreground/35" />
            </div>
            <div>
              <p className="text-[12px] font-medium text-foreground/70">
                اعلانی وجود ندارد
              </p>
              <p className="mt-0.5 text-[10px] text-foreground/35">
                اعلان‌های جدید اینجا نمایش داده می‌شوند
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-0.5 px-1.5 py-2">
            {invitations.length > 0 && (
              <>
                <p className="px-1.5 pt-0.5 pb-1 text-[9px] font-medium tracking-[0.14em] text-foreground/35 uppercase">
                  دعوت‌نامه‌ها
                </p>
                <div className="mb-1.5 flex flex-col gap-1.5 px-0.5">
                  {invitations.map((n) => (
                    <React.Fragment key={n.id}>
                      {adapter.renderInvitation!(
                        n,
                        handleRowRead,
                        fetchServerNotifs
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </>
            )}

            {otherServer.length > 0 && (
              <>
                {invitations.length > 0 && (
                  <p className="mt-0.5 px-1.5 pb-1 text-[9px] font-medium tracking-[0.14em] text-foreground/35 uppercase">
                    اعلان‌ها
                  </p>
                )}
                <div className="flex flex-col gap-0.5">
                  {otherServer.map((n) => (
                    <ServerNotifRow
                      key={n.id}
                      notif={n}
                      onRead={handleRowRead}
                    />
                  ))}
                </div>
              </>
            )}

            {notifications.length > 0 && (
              <>
                {(invitations.length > 0 || otherServer.length > 0) && (
                  <div className="mx-2 my-1.5 border-t border-foreground/10" />
                )}
                <div className="flex flex-col gap-0.5">
                  {notifications.map((n) => (
                    <MemoryNotifRow key={n.id} notif={n} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="h-1" />
    </div>
  )
}

// ─── Compact pill content ──────────────────────────────────────────────────────

function CompactBell({
  count,
  onClick,
}: {
  count: number
  onClick: () => void
}) {
  const time = useClock()

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`اعلان‌ها${count > 0 ? ` — ${count} خوانده نشده` : ""}`}
      className="flex items-center gap-2.5 px-3.5 py-2"
    >
      <span className="font-mono text-[11px] text-foreground/70 tabular-nums">
        {time}
      </span>
      <span className="h-3 w-px rounded-full bg-foreground/20" />
      <span className="relative">
        <span className="icon-[lucide--bell] size-3.5 text-foreground/80" />
        {count > 0 && (
          <span className="absolute -end-1 -top-1 flex min-w-[13px] items-center justify-center rounded-full bg-rose-500 px-0.5 py-px text-[8px] leading-none font-bold text-white">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </span>
    </button>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * The two pre-extraction shells, both preserved verbatim:
 *
 * - "overlay" (panel): a fixed-position island with a full-screen click-away
 *   backdrop. `showOnDesktop` keeps the panel app's prop — when false, the
 *   island is mobile-only (`lg:hidden`).
 * - "inline" (website): the island lives inline in a reserved 110×36 slot
 *   (e.g. inside the marketing header) and closes on outside click / Escape.
 */
export function NotificationCenter({
  adapter,
  variant,
  showOnDesktop = true,
}: {
  adapter: NotificationCenterAdapter
  variant: "overlay" | "inline"
  showOnDesktop?: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const view = open ? "notifications" : null
  const wrapRef = React.useRef<HTMLDivElement>(null)

  const unreadCount = adapter.store((s) => s.unreadCount)
  const serverUnread = adapter.store((s) => s.serverUnread)
  const prevCountRef = React.useRef<number | null>(null)
  const [playNotifSound] = useSound(adapter.sound, { interrupt: true })

  const totalUnread = unreadCount + serverUnread

  // Sound when badge increases (WS-driven)
  React.useEffect(() => {
    if (prevCountRef.current !== null && totalUnread > prevCountRef.current) {
      playNotifSound()
    }
    prevCountRef.current = totalUnread
  }, [totalUnread, playNotifSound])

  // Close on outside click / Escape (inline variant only — the overlay
  // variant closes via its full-screen backdrop instead).
  React.useEffect(() => {
    if (variant !== "inline" || !open) return
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [variant, open])

  function handleClose() {
    setOpen(false)
  }

  const island = (
    <DynamicIsland
      view={view}
      compact={
        <CompactBell count={totalUnread} onClick={() => setOpen(true)} />
      }
    >
      <DynamicIslandView id="notifications">
        <NotificationCenterPanel adapter={adapter} onClose={handleClose} />
      </DynamicIslandView>
    </DynamicIsland>
  )

  if (variant === "inline") {
    // Inline in a header. The reserved slot keeps the pill from shifting
    // layout; the island is absolutely positioned so the expanded panel
    // overlays page content — growing rightward on mobile and leftward
    // (into content) beside the right-hand column on desktop.
    return (
      <div ref={wrapRef} className="relative h-9 w-[110px] shrink-0" dir="ltr">
        <div className="absolute top-0 left-0 z-50 lg:right-0 lg:left-auto">
          {island}
        </div>
      </div>
    )
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-[49]"
          onClick={handleClose}
          aria-hidden="true"
        />
      )}

      <div
        className={cn(
          "fixed z-[50]",
          "top-[14px] left-1/2 -translate-x-1/2",
          showOnDesktop
            ? "lg:top-[32px] lg:right-[184px] lg:left-auto lg:translate-x-0"
            : "lg:hidden"
        )}
        dir="ltr"
      >
        {island}
      </div>
    </>
  )
}
