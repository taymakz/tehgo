"use client"

import * as React from "react"
import { Loader2Icon } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { RatingInput } from "@workspace/ui/components/rating"
import { Textarea } from "@workspace/ui/components/textarea"
import {
  ResponsiveDialog,
  ResponsiveDialogDescription,
  ResponsiveDialogPanel,
  ResponsiveDialogPopup,
  ResponsiveDialogTitle,
} from "@workspace/ui/components/responsive-dialog"

export interface ReviewTarget {
  /** orderItemId for a product target; undefined for the general/overall target. */
  key: string | undefined
  label: string
  imageUrl?: string | null
  /** Pre-fill for editing an existing review (My Reviews "edit all at once"). */
  initialRating?: number
  initialComment?: string | null
}

export interface ReviewSubmission {
  key: string | undefined
  rating: number
  comment: string
}

export interface ReviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** What can be rated in this session — order line items + (optionally) a general slot. */
  targets: ReviewTarget[]
  /** Submit every rated (rating > 0) target. Throw to surface an error. */
  onSubmit: (submissions: ReviewSubmission[]) => Promise<void>
  onSuccess?: () => void
  title?: string
  description?: string
  submitLabel?: string
}

function initialRatingsOf(targets: ReviewTarget[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const t of targets) {
    if (t.initialRating) out[t.key ?? "__general__"] = t.initialRating
  }
  return out
}

function initialCommentsOf(targets: ReviewTarget[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const t of targets) {
    if (t.initialComment) out[t.key ?? "__general__"] = t.initialComment
  }
  return out
}

export function ReviewDialog({
  open,
  onOpenChange,
  targets,
  onSubmit,
  onSuccess,
  title = "سفارشتون چطور بود؟",
  description = "نظر شما پس از بررسی، برای دیگران قابل مشاهده خواهد بود.",
  submitLabel = "ثبت نظر",
}: ReviewDialogProps) {
  const [ratings, setRatings] = React.useState<Record<string, number>>(() =>
    initialRatingsOf(targets)
  )
  const [comments, setComments] = React.useState<Record<string, string>>(() =>
    initialCommentsOf(targets)
  )
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const reset = React.useCallback(() => {
    setRatings(initialRatingsOf(targets))
    setComments(initialCommentsOf(targets))
    setSubmitting(false)
    setError(null)
    // Only re-seed from `targets` when the dialog transitions closed→open,
    // not on every parent re-render (targets is a fresh array each render).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-seed whenever the dialog opens, so edit mode always reflects the
  // latest values of whatever review the caller passed in.
  React.useEffect(() => {
    if (open) {
      setRatings(initialRatingsOf(targets))
      setComments(initialCommentsOf(targets))
      setError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function handleOpenChange(next: boolean) {
    if (!next && submitting) return
    if (!next) reset()
    onOpenChange(next)
  }

  function keyOf(t: ReviewTarget) {
    return t.key ?? "__general__"
  }

  const ratedTargets = targets.filter((t) => (ratings[keyOf(t)] ?? 0) > 0)
  const hasMissingReason = ratedTargets.some(
    (t) => ratings[keyOf(t)]! < 5 && !(comments[keyOf(t)] ?? "").trim()
  )

  async function handleSubmit() {
    const submissions: ReviewSubmission[] = targets
      .filter((t) => (ratings[keyOf(t)] ?? 0) > 0)
      .map((t) => ({
        key: t.key,
        rating: ratings[keyOf(t)]!,
        comment: (comments[keyOf(t)] ?? "").trim(),
      }))

    if (submissions.length === 0) {
      setError("لطفاً حداقل به یک مورد امتیاز بدهید.")
      return
    }

    const missingReason = submissions.find((s) => s.rating < 5 && !s.comment)
    if (missingReason) {
      setError("برای امتیاز کمتر از ۵ ستاره، نوشتن دلیل الزامی است.")
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await onSubmit(submissions)
      reset()
      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "ثبت نظر ناموفق بود.")
      setSubmitting(false)
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
      <ResponsiveDialogPopup
        className="max-w-md"
        closeProps={{ disabled: submitting }}
      >
        <div dir="rtl" className="flex min-h-0 flex-col">
          <div className="border-b border-border/60 px-5 py-3.5 pe-12">
            <ResponsiveDialogTitle className="font-heading text-sm">
              {title}
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription className="mt-0.5 text-xs text-muted-foreground">
              {description}
            </ResponsiveDialogDescription>
          </div>

          <ResponsiveDialogPanel
            className="max-h-[60vh] space-y-5 overflow-y-auto"
            drawerClassName="max-h-[60vh] space-y-5 overflow-y-auto"
          >
            {targets.map((t) => {
              const k = keyOf(t)
              return (
                <div
                  key={k}
                  className="space-y-2 border-b border-border/40 pb-4 last:border-b-0 last:pb-0"
                >
                  <div className="flex items-center gap-2">
                    {t.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element -- shared UI package, no next/image
                      <img
                        src={t.imageUrl}
                        alt=""
                        className="size-8 rounded-md object-cover"
                      />
                    )}
                    <span className="text-sm font-medium">{t.label}</span>
                  </div>
                  <RatingInput
                    value={ratings[k] ?? 0}
                    onChange={(v) => setRatings((r) => ({ ...r, [k]: v }))}
                    disabled={submitting}
                  />
                  {(ratings[k] ?? 0) > 0 && (
                    <>
                      <Textarea
                        value={comments[k] ?? ""}
                        onChange={(e) =>
                          setComments((c) => ({ ...c, [k]: e.target.value }))
                        }
                        placeholder={
                          ratings[k]! < 5
                            ? "لطفاً دلیل امتیاز خود را بنویسید (الزامی)…"
                            : "نظرتون رو بنویسید (اختیاری)…"
                        }
                        maxLength={2000}
                        disabled={submitting}
                        className="min-h-16 resize-none text-sm"
                      />
                      {ratings[k]! < 5 && !(comments[k] ?? "").trim() && (
                        <p className="text-[11px] text-destructive">
                          برای امتیاز کمتر از ۵ ستاره، نوشتن دلیل الزامی است.
                        </p>
                      )}
                    </>
                  )}
                </div>
              )
            })}

            {error && (
              <p className="text-xs text-destructive" role="alert">
                {error}
              </p>
            )}
          </ResponsiveDialogPanel>

          <div className="flex items-center justify-end gap-2 border-t border-border/60 px-5 py-3">
            <Button
              type="button"
              variant="ghost"
              disabled={submitting}
              onClick={() => handleOpenChange(false)}
            >
              بعداً
            </Button>
            <Button
              type="button"
              disabled={
                submitting || ratedTargets.length === 0 || hasMissingReason
              }
              onClick={() => void handleSubmit()}
            >
              {submitting && <Loader2Icon className="size-4 animate-spin" />}
              {submitLabel}
            </Button>
          </div>
        </div>
      </ResponsiveDialogPopup>
    </ResponsiveDialog>
  )
}
