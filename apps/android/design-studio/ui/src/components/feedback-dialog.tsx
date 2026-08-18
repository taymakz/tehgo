"use client"

import * as React from "react"
import {
  BugIcon,
  HeartIcon,
  LightbulbIcon,
  Loader2Icon,
  PaperclipIcon,
} from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import { Textarea } from "@workspace/ui/components/textarea"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  ResponsiveDialog,
  ResponsiveDialogDescription,
  ResponsiveDialogPopup,
  ResponsiveDialogTitle,
} from "@workspace/ui/components/responsive-dialog"
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadItemDelete,
  FileUploadItemMetadata,
  FileUploadItemPreview,
  FileUploadItemProgress,
  FileUploadList,
  FileUploadTrigger,
} from "@workspace/ui/components/file-upload"

export type FeedbackKind = "BUG" | "IDEA" | "PRAISE"

export interface FeedbackTechnicalContext {
  url?: string
  userAgent?: string
  screen?: string
  viewport?: string
  locale?: string
}

export interface FeedbackSubmitPayload {
  kind: FeedbackKind
  message: string
  mediaIds: string[]
  pageUrl?: string
  technicalContext?: FeedbackTechnicalContext
}

export interface FeedbackUploadResult {
  mediaId: string
  url: string
  originalFilename: string
  mimeType: string
  size: number
}

export interface FeedbackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Submit the feedback. Throw to surface an error message in the dialog. */
  onSubmit: (payload: FeedbackSubmitPayload) => Promise<void>
  /** Upload a single attachment; resolve with the created media id. */
  onUpload: (
    file: File,
    onProgress: (pct: number) => void
  ) => Promise<FeedbackUploadResult>
  /** Called after a successful submit (e.g. to fire a toast). */
  onSuccess?: () => void
}

const MAX_FILES = 5
const MAX_SIZE = 10 * 1024 * 1024 // 10 MB
const ACCEPT = "image/*,application/pdf,.txt,text/plain"

const KINDS: {
  id: FeedbackKind
  label: string
  description: string
  placeholder: string
  Icon: typeof BugIcon
}[] = [
  {
    id: "BUG",
    label: "مشکل و خطا",
    description: "یک خطا، اشکال یا رفتاری که انتظارش را نداشتید.",
    placeholder: "چه کاری انجام دادید؟ چه دیدید؟ انتظار چه چیزی داشتید؟",
    Icon: BugIcon,
  },
  {
    id: "IDEA",
    label: "پیشنهاد و ایده",
    description: "چیزی که Cafify را برای شما بهتر می‌کند.",
    placeholder: "چه چیزی تغییر کند؟ به چه کسی کمک می‌کند؟",
    Icon: LightbulbIcon,
  },
  {
    id: "PRAISE",
    label: "تشکر و قدردانی",
    description: "چیزی که شما را خوشحال کرد و دوست داشتید.",
    placeholder: "چه چیزی خوب کار کرد؟ از چه کسی باید تشکر کنیم؟",
    Icon: HeartIcon,
  },
]

function collectTechnicalContext(): FeedbackTechnicalContext | undefined {
  if (typeof window === "undefined") return undefined
  return {
    url: window.location.href,
    userAgent: window.navigator.userAgent,
    screen: `${window.screen.width}×${window.screen.height}`,
    viewport: `${window.innerWidth}×${window.innerHeight}`,
    locale: window.navigator.language,
  }
}

export function FeedbackDialog({
  open,
  onOpenChange,
  onSubmit,
  onUpload,
  onSuccess,
}: FeedbackDialogProps) {
  const [kind, setKind] = React.useState<FeedbackKind>("IDEA")
  const [message, setMessage] = React.useState("")
  const [includeTech, setIncludeTech] = React.useState(true)
  const [files, setFiles] = React.useState<File[]>([])
  const [pendingUploads, setPendingUploads] = React.useState(0)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // File → uploaded mediaId. Kept in a ref so upload callbacks stay stable.
  const mediaIdsRef = React.useRef(new Map<File, string>())

  const activeKind = KINDS.find((k) => k.id === kind)!

  const reset = React.useCallback(() => {
    setKind("IDEA")
    setMessage("")
    setIncludeTech(true)
    setFiles([])
    setPendingUploads(0)
    setSubmitting(false)
    setError(null)
    mediaIdsRef.current = new Map()
  }, [])

  function handleOpenChange(next: boolean) {
    if (!next && (submitting || pendingUploads > 0)) return
    if (!next) reset()
    onOpenChange(next)
  }

  const handleUpload = React.useCallback(
    async (
      uploadFiles: File[],
      {
        onProgress,
        onSuccess: onFileSuccess,
        onError,
      }: {
        onProgress: (file: File, progress: number) => void
        onSuccess: (file: File) => void
        onError: (file: File, error: Error) => void
      }
    ) => {
      setError(null)
      await Promise.all(
        uploadFiles.map(async (file) => {
          setPendingUploads((n) => n + 1)
          try {
            const result = await onUpload(file, (pct) => onProgress(file, pct))
            mediaIdsRef.current.set(file, result.mediaId)
            onFileSuccess(file)
          } catch (err) {
            onError(
              file,
              err instanceof Error ? err : new Error("آپلود ناموفق بود")
            )
          } finally {
            setPendingUploads((n) => Math.max(0, n - 1))
          }
        })
      )
    },
    [onUpload]
  )

  async function handleSubmit() {
    const trimmed = message.trim()
    if (!trimmed) {
      setError("لطفاً متن بازخورد را بنویسید.")
      return
    }
    if (pendingUploads > 0) return

    const mediaIds = files
      .map((f) => mediaIdsRef.current.get(f))
      .filter((id): id is string => Boolean(id))

    setSubmitting(true)
    setError(null)
    try {
      const tech = includeTech ? collectTechnicalContext() : undefined
      await onSubmit({
        kind,
        message: trimmed,
        mediaIds,
        pageUrl:
          typeof window !== "undefined" ? window.location.href : undefined,
        technicalContext: tech,
      })
      reset()
      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "ارسال بازخورد ناموفق بود.")
      setSubmitting(false)
    }
  }

  const busy = submitting || pendingUploads > 0

  return (
    <ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
      <ResponsiveDialogPopup
        className="max-w-md"
        closeProps={{ disabled: busy }}
      >
        <div dir="rtl" className="flex min-h-0 flex-col">
          {/* Header */}
          <div className="border-b border-border/60 px-5 py-3.5 pe-12">
            <ResponsiveDialogTitle className="font-heading text-sm">
              ارسال بازخورد
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription className="mt-0.5 text-xs text-muted-foreground">
              مستقیم به تیم محصول می‌رسد. معمولاً ظرف یک روز کاری پاسخ می‌دهیم.
            </ResponsiveDialogDescription>
          </div>

          {/* Body */}
          <div className="space-y-4 overflow-y-auto px-5 py-4">
            {/* Kind picker */}
            <div className="grid grid-cols-3 gap-2">
              {KINDS.map((k) => {
                const active = kind === k.id
                return (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => setKind(k.id)}
                    aria-pressed={active}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-center transition-colors",
                      active
                        ? "border-foreground/60 bg-foreground/[0.05]"
                        : "border-border/60 hover:border-foreground/30"
                    )}
                  >
                    <k.Icon className="size-4 opacity-80" />
                    <span className="text-[12px] leading-tight">{k.label}</span>
                  </button>
                )
              })}
            </div>

            <p className="text-xs text-muted-foreground">
              {activeKind.description}
            </p>

            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={activeKind.placeholder}
              maxLength={4000}
              disabled={busy}
              className="min-h-32 resize-none"
            />

            {/* Attachments */}
            <FileUpload
              dir="rtl"
              accept={ACCEPT}
              maxFiles={MAX_FILES}
              maxSize={MAX_SIZE}
              multiple
              disabled={busy}
              value={files}
              onValueChange={(next) => {
                setFiles(next)
                // Prune media ids for files that were removed.
                for (const f of mediaIdsRef.current.keys()) {
                  if (!next.includes(f)) mediaIdsRef.current.delete(f)
                }
              }}
              onUpload={handleUpload}
              onFileReject={(_, msg) =>
                setError(
                  msg === "File too large"
                    ? "حجم فایل بیش از ۱۰ مگابایت است."
                    : msg === "File type not accepted"
                      ? "نوع فایل پشتیبانی نمی‌شود."
                      : `حداکثر ${MAX_FILES} فایل مجاز است.`
                )
              }
            >
              <FileUploadDropzone className="border-dashed p-0">
                <FileUploadTrigger
                  render={
                    <button
                      type="button"
                      className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border/70 bg-background px-3 py-2.5 text-xs text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
                    />
                  }
                >
                  <PaperclipIcon className="size-3.5" />
                  افزودن پیوست (تصویر، PDF یا متن)
                </FileUploadTrigger>
              </FileUploadDropzone>

              <FileUploadList>
                {files.map((file) => (
                  <FileUploadItem key={file.name + file.size} value={file}>
                    <FileUploadItemPreview />
                    <FileUploadItemMetadata size="sm" />
                    <FileUploadItemProgress variant="circular" size={28} />
                    <FileUploadItemDelete
                      render={
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="size-7 shrink-0"
                          aria-label="حذف فایل"
                        />
                      }
                    >
                      <span className="icon-[lucide--x] size-3.5" />
                    </FileUploadItemDelete>
                  </FileUploadItem>
                ))}
              </FileUploadList>
            </FileUpload>

            {error && (
              <p className="text-xs text-destructive" role="alert">
                {error}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-2 border-t border-border/60 px-5 py-3">
            <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
              <Checkbox
                checked={includeTech}
                onCheckedChange={(v) => setIncludeTech(Boolean(v))}
                disabled={busy}
              />
              ارسال اطلاعات فنی
            </label>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                disabled={busy}
                onClick={() => handleOpenChange(false)}
              >
                انصراف
              </Button>
              <Button
                type="button"
                disabled={busy || !message.trim()}
                onClick={() => void handleSubmit()}
              >
                {busy && <Loader2Icon className="size-4 animate-spin" />}
                {pendingUploads > 0 ? "در حال آپلود…" : "ارسال بازخورد"}
              </Button>
            </div>
          </div>
        </div>
      </ResponsiveDialogPopup>
    </ResponsiveDialog>
  )
}
