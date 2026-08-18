// ============================================
// NOTIFICATION TYPE
// ============================================

import {
  NotificationChannel,
  NotificationPriority,
  NotificationType,
} from "@workspace/db/schema"
import { Translation } from "./shared.js"

export const notificationTypeTranslations = {
  SECURITY_ALERT: {
    fa: "هشدار امنیتی",
    en: "Security Alert",
  },

  LOGIN_ALERT: {
    fa: "هشدار ورود",
    en: "Login Alert",
  },

  TICKET: {
    fa: "تیکت",
    en: "Ticket",
  },

  SYSTEM_ALERT: { fa: "هشدار سیستمی", en: "System Alert" },
  NEW_ORDER: { fa: "سفارش جدید", en: "New Order" },
  ORDER_UPDATE: { fa: "به‌روزرسانی سفارش", en: "Order Update" },
  PAYMENT_FAILED: { fa: "پرداخت ناموفق", en: "Payment Failed" },
  SUBSCRIPTION_RENEWED: { fa: "اشتراک تمدید شد", en: "Subscription Renewed" },
  SUBSCRIPTION_EXPIRED: { fa: "اشتراک منقضی شد", en: "Subscription Expired" },
  STOCK_UPDATE: { fa: "به‌روزرسانی موجودی", en: "Stock Update" },
  MEMBER_INVITATION: { fa: "دعوت به عضویت", en: "Member Invitation" },

  CAFE_PENDING_APPROVAL: {
    fa: "کافه جدید در انتظار تأیید",
    en: "New Cafe Awaiting Approval",
  },
  CAFE_APPROVED: { fa: "کافه تأیید شد", en: "Cafe Approved" },
  CAFE_REJECTED: { fa: "کافه رد شد", en: "Cafe Rejected" },
  CAFE_SUSPENDED: { fa: "کافه تعلیق شد", en: "Cafe Suspended" },
  CAFE_REACTIVATED: { fa: "کافه فعال‌سازی مجدد شد", en: "Cafe Reactivated" },

  WITHDRAWAL_REQUESTED: {
    fa: "درخواست برداشت وجه ثبت شد",
    en: "Withdrawal Requested",
  },
  CAFE_WITHDRAWAL_REQUESTED: {
    fa: "درخواست برداشت کافه ثبت شد",
    en: "Cafe Withdrawal Requested",
  },
  WALLET_CARD_PENDING: {
    fa: "کارت بانکی در انتظار تأیید",
    en: "Wallet Card Pending Verification",
  },
  CATEGORY_REQUEST_PENDING: {
    fa: "درخواست دسته‌بندی جدید در انتظار بررسی",
    en: "Category Request Pending",
  },

  USER_REGISTERED: { fa: "کاربر جدید", en: "New User" },
  BRANCH_CREATED: { fa: "شعبه جدید", en: "New Branch" },
  SUBSCRIPTION_PURCHASED: { fa: "خرید اشتراک", en: "Subscription Purchased" },
  FEEDBACK_SUBMITTED: { fa: "بازخورد جدید", en: "New Feedback" },
  SERVER_ERROR: { fa: "خطای سرور", en: "Server Error" },

  REVIEW_PROMPT: { fa: "درخواست ثبت نظر", en: "Review Prompt" },
  REVIEW_MODERATED: { fa: "بررسی نظر", en: "Review Moderated" },
  REVIEW_RECONSIDERATION_REQUESTED: {
    fa: "درخواست بازبینی نظر",
    en: "Review Reconsideration Requested",
  },
  REVIEW_RECONSIDERATION_RESOLVED: {
    fa: "نتیجه بازبینی نظر",
    en: "Review Reconsideration Resolved",
  },
  REVIEW_SUBMITTED: { fa: "نظر جدید", en: "New Review" },
} as const satisfies Record<NotificationType, Translation>

// ============================================
// NOTIFICATION CHANNEL
// ============================================

export const notificationChannelTranslations = {
  IN_APP: {
    fa: "درون‌برنامه‌ای",
    en: "In App",
  },

  EMAIL: {
    fa: "ایمیل",
    en: "Email",
  },

  SMS: {
    fa: "پیامک",
    en: "SMS",
  },

  PUSH: {
    fa: "پوش نوتیفیکیشن",
    en: "Push Notification",
  },

  TELEGRAM: {
    fa: "تلگرام",
    en: "Telegram",
  },
} as const satisfies Record<NotificationChannel, Translation>

// ============================================
// NOTIFICATION PRIORITY
// ============================================

export const notificationPriorityTranslations = {
  LOW: {
    fa: "کم",
    en: "Low",
  },

  NORMAL: {
    fa: "عادی",
    en: "Normal",
  },

  HIGH: {
    fa: "بالا",
    en: "High",
  },

  URGENT: {
    fa: "فوری",
    en: "Urgent",
  },
} as const satisfies Record<NotificationPriority, Translation>
