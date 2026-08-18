import type { NotificationType } from "@workspace/db/schema"

export type NotificationSurfaceKey = "ADMIN" | "PANEL" | "WEBSITE"

export interface NotificationCatalogEntry {
  /** Persian short label shown as the row title. */
  label: string
  /** Persian one-line description. */
  description: string
  /** Group key — rows render grouped, in GROUP_ORDER. */
  group:
    | "security"
    | "review-queue"
    | "platform"
    | "cafe"
    | "orders"
    | "account"
  /** Which preference pages show this row. Empty = internal type, never shown. */
  surfaces: NotificationSurfaceKey[]
}

/**
 * EXHAUSTIVE by construction: adding a value to notificationTypeEnum without
 * updating this map is a compile error in @workspace/ui — that is the entire
 * anti-drift mechanism, do not weaken the type to Partial<...>.
 */
export const NOTIFICATION_CATALOG: Record<
  NotificationType,
  NotificationCatalogEntry
> = {
  // ── Platform / auth ────────────────────────
  SECURITY_ALERT: {
    label: "هشدارهای امنیتی",
    description: "تغییرات حساس مانند رمز عبور، MFA و دستگاه‌های جدید.",
    group: "security",
    surfaces: ["ADMIN"],
  },
  LOGIN_ALERT: {
    label: "هشدار ورود",
    description:
      "ورود جدید به حساب کاربری — همیشه ارسال می‌شود و قابل غیرفعال‌سازی نیست.",
    group: "security",
    surfaces: [],
  },
  TICKET: {
    label: "تیکت پشتیبانی",
    description: "ثبت تیکت جدید یا تغییر وضعیت تیکت‌های پشتیبانی.",
    group: "review-queue",
    surfaces: ["ADMIN", "PANEL", "WEBSITE"],
  },
  SYSTEM_ALERT: {
    label: "پیام‌های سیستمی",
    description: "اطلاع‌رسانی‌های عمومی پلتفرم.",
    group: "security",
    surfaces: ["ADMIN"],
  },

  // ── Cafe domain ────────────────────────────
  NEW_ORDER: {
    label: "سفارش جدید",
    description: "سفارش‌های تازه‌ای که برای کافه ثبت می‌شود.",
    group: "orders",
    surfaces: ["PANEL"],
  },
  ORDER_UPDATE: {
    label: "تغییر وضعیت سفارش",
    description: "تغییر وضعیت سفارش‌ها.",
    group: "orders",
    surfaces: ["PANEL", "WEBSITE"],
  },
  PAYMENT_FAILED: {
    label: "پرداخت ناموفق",
    description: "ناموفق بودن پرداخت اشتراک یا سفارش.",
    group: "cafe",
    surfaces: ["PANEL"],
  },
  SUBSCRIPTION_RENEWED: {
    label: "تمدید اشتراک",
    description: "تمدید اشتراک پولی کافه.",
    group: "platform",
    surfaces: ["ADMIN", "PANEL"],
  },
  SUBSCRIPTION_EXPIRED: {
    label: "انقضای اشتراک",
    description: "پایان دوره اشتراک و بازگشت به طرح رایگان.",
    group: "cafe",
    surfaces: ["PANEL"],
  },
  STOCK_UPDATE: {
    label: "موجودی محصول",
    description: "اتمام یا تغییر وضعیت موجودی محصولات.",
    group: "orders",
    surfaces: ["PANEL"],
  },

  // ── Staff invitations ──────────────────────
  MEMBER_INVITATION: {
    label: "دعوت‌نامه عضویت",
    description: "دعوت به عضویت در یک کافه به‌عنوان کارمند.",
    group: "cafe",
    surfaces: ["PANEL"],
  },

  // ── Cafe lifecycle (admin ⇄ owner) ─────────
  CAFE_PENDING_APPROVAL: {
    label: "کافه‌های در انتظار تأیید",
    description: "ثبت‌نام کافه جدید که در انتظار تأیید شما است.",
    group: "review-queue",
    surfaces: ["ADMIN"],
  },
  CAFE_APPROVED: {
    label: "تأیید کافه",
    description: "تأیید ثبت‌نام کافه توسط مدیریت.",
    group: "cafe",
    surfaces: ["PANEL"],
  },
  CAFE_REJECTED: {
    label: "رد ثبت‌نام کافه",
    description: "رد شدن ثبت‌نام کافه توسط مدیریت.",
    group: "cafe",
    surfaces: ["PANEL"],
  },
  CAFE_SUSPENDED: {
    label: "تعلیق کافه",
    description: "معلق شدن کافه توسط مدیریت.",
    group: "cafe",
    surfaces: ["PANEL"],
  },
  CAFE_REACTIVATED: {
    label: "فعال‌سازی مجدد کافه",
    description: "فعال‌سازی مجدد کافه پس از تعلیق.",
    group: "cafe",
    surfaces: ["PANEL"],
  },

  // ── Admin review queue ──────────────────────
  WITHDRAWAL_REQUESTED: {
    label: "درخواست برداشت",
    description: "درخواست برداشت جدید از کیف پول یک کاربر.",
    group: "review-queue",
    surfaces: ["ADMIN"],
  },
  CAFE_WITHDRAWAL_REQUESTED: {
    label: "درخواست برداشت کافه",
    description: "درخواست برداشت جدید از کیف پول یک کافه.",
    group: "review-queue",
    surfaces: ["ADMIN"],
  },
  WALLET_CARD_PENDING: {
    label: "کارت‌های در انتظار",
    description: "کارت بانکی جدیدی که منتظر تأیید شماست.",
    group: "review-queue",
    surfaces: ["ADMIN"],
  },
  CATEGORY_REQUEST_PENDING: {
    label: "درخواست دسته‌بندی",
    description: "درخواست دسته‌بندی جدید برای منو از سوی یک کافه.",
    group: "review-queue",
    surfaces: ["ADMIN"],
  },
  USER_REGISTERED: {
    label: "کاربر جدید",
    description: "ثبت‌نام کاربر جدید در وب‌سایت یا اپلیکیشن.",
    group: "platform",
    surfaces: ["ADMIN"],
  },
  BRANCH_CREATED: {
    label: "شعبه جدید",
    description: "ایجاد شعبه جدید توسط یک کافه.",
    group: "platform",
    surfaces: ["ADMIN"],
  },
  SUBSCRIPTION_PURCHASED: {
    label: "خرید اشتراک",
    description: "خرید یا ارتقای اشتراک پولی توسط یک کافه.",
    group: "platform",
    surfaces: ["ADMIN"],
  },
  FEEDBACK_SUBMITTED: {
    label: "بازخورد جدید",
    description: "گزارش مشکل، پیشنهاد یا بازخورد جدید از کاربران.",
    group: "review-queue",
    surfaces: ["ADMIN"],
  },
  SERVER_ERROR: {
    label: "خطای سرور",
    description:
      "خطای غیرمنتظره سرور (فقط برای مدیران ارشد/سوپرادمین ارسال می‌شود).",
    group: "security",
    surfaces: ["ADMIN"],
  },

  // ── Reviews ─────────────────────────────────
  REVIEW_PROMPT: {
    label: "نظرسنجی سفارش",
    description: "یادآوری ثبت نظر پس از سفارش.",
    group: "account",
    surfaces: ["WEBSITE"],
  },
  REVIEW_MODERATED: {
    label: "وضعیت نظر شما",
    description: "تأیید یا رد نظر ثبت‌شده توسط مدیریت.",
    group: "account",
    surfaces: ["WEBSITE"],
  },
  REVIEW_RECONSIDERATION_REQUESTED: {
    label: "درخواست‌های بازبینی نظر",
    description: "درخواست بازبینی یک نظر که توسط کارمند کافه ثبت شده است.",
    group: "review-queue",
    surfaces: ["ADMIN"],
  },
  REVIEW_RECONSIDERATION_RESOLVED: {
    label: "نتیجه درخواست بازبینی نظر",
    description: "نتیجه بررسی درخواست بازبینی نظری که ثبت کرده‌اید.",
    group: "account",
    surfaces: ["PANEL"],
  },
  REVIEW_SUBMITTED: {
    label: "نظر جدید",
    description: "ثبت نظر جدید توسط مشتری که در انتظار بررسی است.",
    group: "review-queue",
    surfaces: ["ADMIN"],
  },
}

export const GROUP_ORDER: Record<
  NotificationCatalogEntry["group"],
  { title: string; description: string }
> = {
  security: {
    title: "امنیت و سیستم",
    description: "رویدادهای امنیتی و پیام‌های عمومی پلتفرم.",
  },
  "review-queue": {
    title: "موارد نیازمند بررسی",
    description: "رویدادهایی که نیاز به بررسی یا پیگیری دارند.",
  },
  platform: {
    title: "رویدادهای پلتفرم",
    description: "رشد و فعالیت پلتفرم — ثبت‌نام‌ها، شعبه‌ها و اشتراک‌ها.",
  },
  orders: {
    title: "سفارش‌ها و موجودی",
    description: "سفارش‌های جدید، تغییر وضعیت و موجودی محصولات.",
  },
  cafe: {
    title: "رویدادهای کافه",
    description: "وضعیت کافه، اشتراک و پرداخت‌ها.",
  },
  account: {
    title: "حساب و پشتیبانی",
    description: "تیکت‌های پشتیبانی، نظرات و بازبینی‌ها.",
  },
}

export interface NotificationCatalogRow extends NotificationCatalogEntry {
  type: NotificationType
}

export interface NotificationCatalogGroup {
  group: NotificationCatalogEntry["group"]
  title: string
  description: string
  rows: NotificationCatalogRow[]
}

export function catalogForSurface(
  surface: NotificationSurfaceKey
): NotificationCatalogGroup[] {
  const groups = new Map<
    NotificationCatalogEntry["group"],
    NotificationCatalogRow[]
  >()

  for (const [type, entry] of Object.entries(NOTIFICATION_CATALOG) as [
    NotificationType,
    NotificationCatalogEntry,
  ][]) {
    if (!entry.surfaces.includes(surface)) continue

    const rows = groups.get(entry.group) ?? []
    rows.push({ type, ...entry })
    groups.set(entry.group, rows)
  }

  return (
    Object.keys(GROUP_ORDER) as NotificationCatalogEntry["group"][]
  ).flatMap((group) => {
    const rows = groups.get(group)
    if (!rows || rows.length === 0) return []
    return [{ group, ...GROUP_ORDER[group], rows }]
  })
}
