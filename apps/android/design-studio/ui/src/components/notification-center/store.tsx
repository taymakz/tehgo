"use client"

// Shared notifications store for the panel & website apps (extracted in the
// notification-center unification — both apps previously carried a
// line-for-line identical copy of this store).
//
// `@workspace/ui` deliberately does NOT depend on zustand — each app passes
// its own `create` from "zustand" into `createNotificationsStore(create)`.
// The minimal structural types below describe exactly the slice of zustand's
// surface this store needs (plain hook call + selector call + getState);
// zustand's real `create`/hook satisfy them.

// ─── In-memory notifications (toasts, local events) ───────────────────────────

export type AppNotification = {
  id: string
  type: "success" | "error" | "info" | "warning"
  title: string
  description?: string
  timestamp: Date
  read: boolean
}

// ─── Server notifications (from API / WS) ────────────────────────────────────

export type ServerNotification = {
  id: string
  type: string
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT"
  title: string
  message: string
  actionUrl: string | null
  isRead: boolean
  readAt: string | null
  createdAt: string
  data: Record<string, unknown> | null
}

// ─── Store ────────────────────────────────────────────────────────────────────

export type NotificationsState = {
  // In-memory
  notifications: AppNotification[]
  unreadCount: number
  addNotification: (
    n: Omit<AppNotification, "id" | "timestamp" | "read">
  ) => void
  markAllRead: () => void
  clearAll: () => void

  // Server / WS-driven
  serverNotifs: ServerNotification[]
  serverNotifsLoaded: boolean
  serverUnread: number
  setServerUnread: (n: number) => void
  incrementServerUnread: () => void
  decrementServerUnread: () => void
  setServerNotifs: (notifs: ServerNotification[]) => void
  prependServerNotif: (notif: ServerNotification) => void
  markServerNotifRead: (id: string) => void
  markAllServerNotifsRead: () => void
  clearServerNotifs: () => void
}

// ─── Minimal structural zustand types ─────────────────────────────────────────

type SetState<T> = (partial: Partial<T> | ((state: T) => Partial<T>)) => void

/** The bound store hook: plain call, selector call, and getState. */
export type NotificationsStoreHook = {
  (): NotificationsState
  <U>(selector: (state: NotificationsState) => U): U
  getState: () => NotificationsState
}

/** Structural shape of zustand's `create` for this state type. */
export type ZustandCreate = (
  initializer: (set: SetState<NotificationsState>) => NotificationsState
) => unknown

export function createNotificationsStore(
  create: ZustandCreate
): NotificationsStoreHook {
  return create((set) => ({
    // In-memory
    notifications: [],
    unreadCount: 0,

    addNotification: (n) =>
      set((state) => {
        const notification: AppNotification = {
          ...n,
          id: crypto.randomUUID(),
          timestamp: new Date(),
          read: false,
        }
        return {
          notifications: [notification, ...state.notifications].slice(0, 50),
          unreadCount: state.unreadCount + 1,
        }
      }),

    markAllRead: () =>
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      })),

    clearAll: () => set({ notifications: [], unreadCount: 0 }),

    // Server / WS-driven
    serverNotifs: [],
    serverNotifsLoaded: false,
    serverUnread: 0,

    setServerUnread: (n) => set({ serverUnread: Math.max(0, n) }),
    incrementServerUnread: () =>
      set((s) => ({ serverUnread: s.serverUnread + 1 })),
    decrementServerUnread: () =>
      set((s) => ({ serverUnread: Math.max(0, s.serverUnread - 1) })),

    setServerNotifs: (notifs) =>
      set({ serverNotifs: notifs, serverNotifsLoaded: true }),

    prependServerNotif: (notif) =>
      set((s) => ({
        serverNotifs: [notif, ...s.serverNotifs].slice(0, 50),
      })),

    // Decrements exactly when the row was present locally and unread — a
    // repeated event for an already-read row must not drive the badge below
    // truth. Rows outside the local list are reconciled by the server's
    // authoritative `unread_count` WS event instead.
    markServerNotifRead: (id) =>
      set((s) => {
        const wasUnread = s.serverNotifs.some((n) => n.id === id && !n.isRead)
        return {
          serverNotifs: s.serverNotifs.map((n) =>
            n.id === id
              ? {
                  ...n,
                  isRead: true,
                  readAt: n.readAt ?? new Date().toISOString(),
                }
              : n
          ),
          serverUnread: wasUnread
            ? Math.max(0, s.serverUnread - 1)
            : s.serverUnread,
        }
      }),

    markAllServerNotifsRead: () =>
      set((s) => ({
        serverNotifs: s.serverNotifs.map((n) => ({
          ...n,
          isRead: true,
          readAt: n.readAt ?? new Date().toISOString(),
        })),
        serverUnread: 0,
      })),

    clearServerNotifs: () =>
      set({ serverNotifs: [], serverNotifsLoaded: false, serverUnread: 0 }),
  })) as NotificationsStoreHook
}
