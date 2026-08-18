"use client"

import * as React from "react"
import { motion } from "motion/react"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  ResponsiveDialog,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogPopup,
  ResponsiveDialogTitle,
} from "@workspace/ui/components/responsive-dialog"

export interface BalanceTransferProps {
  /** Source (debited) — e.g. gift balance. Amounts in Toman. */
  fromLabel: string
  fromBalance: number
  /** Destination (credited) — e.g. main balance. Read-only. */
  toLabel: string
  toBalance: number
  /** Minimum transfer amount (Toman). */
  minAmount?: number
  currencyLabel?: string
  submitting?: boolean
  error?: string | null
  onSubmit: (amountToman: number) => void
  className?: string
}

function Field({
  label,
  balance,
  icon,
  tone,
  children,
}: {
  label: string
  balance: number
  icon: string
  tone: "from" | "to"
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4",
        tone === "from"
          ? "border-emerald-500/20 bg-emerald-500/[0.04]"
          : "border-border/60 bg-background/60"
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <span
            className={cn(
              icon,
              "size-3.5",
              tone === "from" && "text-emerald-600 dark:text-emerald-400"
            )}
          />
          {label}
        </span>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          موجودی: {balance.toLocaleString("fa-IR")}
        </span>
      </div>
      {children}
    </div>
  )
}

function toLatinDigits(s: string) {
  return s.replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
}

export function BalanceTransfer({
  fromLabel,
  fromBalance,
  toLabel,
  toBalance,
  minAmount = 1000,
  currencyLabel = "تومان",
  submitting,
  error,
  onSubmit,
  className,
}: BalanceTransferProps) {
  const [amount, setAmount] = React.useState("")
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const numericAmount = Number(amount) || 0
  const displayValue = amount ? Number(amount).toLocaleString("fa-IR") : ""

  const tooSmall = numericAmount > 0 && numericAmount < minAmount
  const tooLarge = numericAmount > fromBalance
  const valid = numericAmount >= minAmount && numericAmount <= fromBalance

  const localError = tooLarge
    ? "بیشتر از موجودی هدیه است."
    : tooSmall
      ? `حداقل مبلغ ${minAmount.toLocaleString("fa-IR")} ${currencyLabel} است.`
      : null

  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 rounded-3xl border border-border/30 bg-card p-4",
        className
      )}
    >
      {/* From — gift (editable) */}
      <Field
        label={fromLabel}
        balance={fromBalance}
        icon="icon-[lucide--gift]"
        tone="from"
      >
        <div className="flex items-center gap-2">
          <input
            value={displayValue}
            onChange={(e) => {
              const raw = toLatinDigits(e.target.value)
                .replace(/[^\d]/g, "")
                .slice(0, 12)
              setAmount(raw)
            }}
            inputMode="numeric"
            dir="rtl"
            placeholder="۰"
            className="min-w-0 flex-1 bg-transparent text-right font-vazir text-2xl font-bold tabular-nums outline-none placeholder:text-muted-foreground/40"
          />
          <button
            type="button"
            onClick={() => setAmount(String(fromBalance))}
            disabled={fromBalance <= 0}
            className="shrink-0 rounded-full border border-emerald-500/30 px-2.5 py-1 text-[11px] font-medium text-emerald-600 transition-colors hover:bg-emerald-500/10 disabled:opacity-40 dark:text-emerald-400"
          >
            همه
          </button>
        </div>
      </Field>

      {/* One-way transfer indicator (reverse not allowed) */}
      <div className="relative -my-2.5 flex items-center justify-center">
        <motion.div
          initial={false}
          animate={{ y: [0, 2, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          className="z-10 flex size-9 items-center justify-center rounded-xl border border-border bg-background shadow-sm"
        >
          <span className="icon-[lucide--arrow-down] size-4 text-primary" />
        </motion.div>
      </div>

      {/* To — main (read-only) */}
      <Field
        label={toLabel}
        balance={toBalance}
        icon="icon-[lucide--banknote]"
        tone="to"
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-right font-vazir text-2xl font-bold tabular-nums">
            {(toBalance + numericAmount).toLocaleString("fa-IR")}
          </p>
          {numericAmount > 0 && (
            <span className="shrink-0 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              موجودی بعد انتقال
            </span>
          )}
        </div>
      </Field>

      {(error || localError) && (
        <p className="px-1 pt-1 text-xs text-destructive">
          {error || localError}
        </p>
      )}

      <Button
        type="button"
        className="mt-2 h-11 rounded-2xl text-sm font-semibold"
        disabled={!valid || submitting}
        onClick={() => valid && setConfirmOpen(true)}
      >
        {submitting && <Spinner className="ml-2 size-4" />}
        <span className="ml-1.5 icon-[lucide--arrow-left-right] size-4" />
        انتقال به موجودی اصلی
      </Button>

      <ResponsiveDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <ResponsiveDialogPopup className="sm:max-w-sm">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>آیا مطمئن هستید؟</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              انتقال{" "}
              <span className="font-vazir font-semibold text-foreground">
                {numericAmount.toLocaleString("fa-IR")} {currencyLabel}
              </span>{" "}
              از موجودی هدیه به موجودی اصلی{" "}
              <span className="text-destructive">قابل بازگشت نیست.</span>
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogFooter>
            <div className="grid w-full grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="h-11 rounded-2xl"
                onClick={() => setConfirmOpen(false)}
              >
                انصراف
              </Button>
              <Button
                className="h-11 rounded-2xl"
                disabled={submitting}
                onClick={() => {
                  setConfirmOpen(false)
                  onSubmit(numericAmount)
                }}
              >
                {submitting && <Spinner className="ml-2 size-4" />}
                بله، انتقال بده
              </Button>
            </div>
          </ResponsiveDialogFooter>
        </ResponsiveDialogPopup>
      </ResponsiveDialog>
    </div>
  )
}
