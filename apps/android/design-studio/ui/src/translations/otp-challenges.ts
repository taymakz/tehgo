import type { OtpPurpose, OtpChannel, OtpStatus } from "@workspace/db/schema"
import { Translation } from "./shared.js"

export const otpPurposeTranslations = {
  LOGIN: {
    fa: "ورود",
    en: "Login",
  },
  RESET_PASSWORD: {
    fa: "بازنشانی رمز عبور",
    en: "Reset Password",
  },
  VERIFY_PHONE: {
    fa: "تأیید شماره موبایل",
    en: "Verify Phone",
  },
  MFA_DISABLE: {
    fa: "غیرفعال‌سازی MFA",
    en: "Disable MFA",
  },
  CAFE_DELETE: {
    fa: "حذف کافه",
    en: "Delete Cafe",
  },
} as const satisfies Record<OtpPurpose, Translation>

export const otpChannelTranslations = {
  SMS: {
    fa: "پیامک",
    en: "SMS",
  },
  TELEGRAM: {
    fa: "تلگرام",
    en: "Telegram",
  },
} as const satisfies Record<OtpChannel, Translation>

export const otpStatusTranslations = {
  PENDING: {
    fa: "در انتظار",
    en: "Pending",
  },
  VERIFIED: {
    fa: "تأیید شده",
    en: "Verified",
  },
  EXPIRED: {
    fa: "منقضی شده",
    en: "Expired",
  },
  CANCELLED: {
    fa: "لغو شده",
    en: "Cancelled",
  },
} as const satisfies Record<OtpStatus, Translation>
