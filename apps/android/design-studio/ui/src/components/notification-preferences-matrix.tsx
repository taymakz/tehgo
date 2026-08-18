"use client"

import { useEffect, useState } from "react"
import {
  catalogForSurface,
  type NotificationSurfaceKey,
} from "@workspace/ui/data/notification-catalog"
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@workspace/ui/components/frame"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Switch } from "@workspace/ui/components/switch"
import { toastManager } from "@workspace/ui/components/toast"
import { ApiError } from "@workspace/ui/lib/api-core"

type PreferenceEntry = { enabled?: boolean; telegram?: boolean }
type PreferencesMap = Record<string, PreferenceEntry>

export interface NotificationPreferencesMatrixProps {
  surface: NotificationSurfaceKey
  telegramLinked: boolean
  /** Anchor/id of the Telegram link card on the same page, for the CTA. */
  telegramCardId?: string
  getPreferences: () => Promise<PreferencesMap>
  updatePreferences: (patch: PreferencesMap) => Promise<unknown>
}

export function NotificationPreferencesMatrix({
  surface,
  telegramLinked,
  telegramCardId = "telegram-link-card",
  getPreferences,
  updatePreferences,
}: NotificationPreferencesMatrixProps) {
  const [preferences, setPreferences] = useState<PreferencesMap>({})
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState<Record<string, boolean>>({})
  const [telegramPending, setTelegramPending] = useState<
    Record<string, boolean>
  >({})

  const groups = catalogForSurface(surface)

  useEffect(() => {
    getPreferences()
      .then(setPreferences)
      .catch(() => {})
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleToggle = async (
    field: "enabled" | "telegram",
    type: string,
    value: boolean
  ) => {
    const pendingSetter = field === "enabled" ? setPending : setTelegramPending
    setPreferences((prev) => ({
      ...prev,
      [type]: { ...prev[type], [field]: value },
    }))
    pendingSetter((prev) => ({ ...prev, [type]: true }))
    try {
      await updatePreferences({ [type]: { [field]: value } })
    } catch (err) {
      setPreferences((prev) => ({
        ...prev,
        [type]: { ...prev[type], [field]: !value },
      }))
      toastManager.add({
        title: err instanceof ApiError ? err.message : "خطا در ذخیره تنظیمات",
        type: "error",
      })
    } finally {
      pendingSetter((prev) => ({ ...prev, [type]: false }))
    }
  }

  const scrollToTelegramCard = () => {
    document.getElementById(telegramCardId)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    })
  }

  return (
    <div className="space-y-6">
      {groups.map((group, groupIndex) => (
        <Frame key={group.group}>
          <FrameHeader>
            <FrameTitle>{group.title}</FrameTitle>
            <FrameDescription>{group.description}</FrameDescription>
          </FrameHeader>

          <FramePanel>
            {!telegramLinked && groupIndex === 0 && (
              <button
                type="button"
                onClick={scrollToTelegramCard}
                className="mb-4 block w-full rounded-lg bg-muted px-3 py-2 text-start text-xs text-muted-foreground underline-offset-2 hover:underline"
              >
                برای دریافت اعلان‌ها در تلگرام، ابتدا حساب تلگرام خود را متصل
                کنید.
              </button>
            )}

            {loading ? (
              <div className="space-y-3">
                {group.rows.map((row) => (
                  <Skeleton key={row.type} className="h-14 w-full rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="flex flex-col divide-y">
                <div className="flex items-center gap-4 pb-3">
                  <div className="flex-1" />
                  <div className="w-16 text-center text-xs text-muted-foreground">
                    داخل برنامه
                  </div>
                  <div className="w-16 text-center text-xs text-muted-foreground">
                    تلگرام
                  </div>
                </div>

                {group.rows.map((row) => {
                  const enabled = preferences[row.type]?.enabled !== false
                  const telegram = preferences[row.type]?.telegram !== false

                  return (
                    <div
                      key={row.type}
                      className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex-1">
                        <div className="text-sm font-medium">{row.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {row.description}
                        </div>
                      </div>

                      <div className="flex w-16 items-center justify-center">
                        <Switch
                          checked={enabled}
                          disabled={pending[row.type]}
                          onCheckedChange={(v) =>
                            handleToggle("enabled", row.type, v)
                          }
                        />
                      </div>

                      <div className="flex w-16 items-center justify-center">
                        <Switch
                          checked={telegram}
                          disabled={
                            !telegramLinked ||
                            !enabled ||
                            telegramPending[row.type]
                          }
                          onCheckedChange={(v) =>
                            handleToggle("telegram", row.type, v)
                          }
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {group.group === "security" && (
              <FrameDescription className="mt-4">
                هشدار ورود و کد یکبار مصرف همیشه از طریق تلگرام ارسال می‌شود و
                غیرفعال‌سازی آن ممکن نیست.
              </FrameDescription>
            )}
          </FramePanel>
        </Frame>
      ))}

      {groups.length > 0 && !groups.some((g) => g.group === "security") && (
        <p className="px-1 text-xs text-muted-foreground">
          کد یکبارمصرف و هشدار ورود همیشه از طریق تلگرام ارسال می‌شوند.
        </p>
      )}
    </div>
  )
}
