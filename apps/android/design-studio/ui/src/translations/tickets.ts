import type {
  TicketCategory,
  TicketMessageSenderType,
  TicketPriority,
  TicketStatus,
} from "@workspace/db/schema"
import { Translation } from "./shared.js"

export const ticketStatusTranslations = {
  OPEN: {
    fa: "باز",
    en: "Open",
  },
  IN_PROGRESS: {
    fa: "در حال بررسی",
    en: "In Progress",
  },
  WAITING_FOR_USER: {
    fa: "در انتظار پاسخ کاربر",
    en: "Waiting for User",
  },
  WAITING_FOR_SUPPORT: {
    fa: "در انتظار پاسخ پشتیبانی",
    en: "Waiting for Support",
  },
  RESOLVED: {
    fa: "حل‌شده",
    en: "Resolved",
  },
  CLOSED: {
    fa: "بسته‌شده",
    en: "Closed",
  },
} as const satisfies Record<TicketStatus, Translation>

export const ticketPriorityTranslations = {
  LOW: {
    fa: "کم",
    en: "Low",
  },
  NORMAL: {
    fa: "عادی",
    en: "Normal",
  },
  HIGH: {
    fa: "زیاد",
    en: "High",
  },
  URGENT: {
    fa: "فوری",
    en: "Urgent",
  },
} as const satisfies Record<TicketPriority, Translation>

export const ticketCategoryTranslations = {
  ACCOUNT: {
    fa: "حساب کاربری",
    en: "Account",
  },
  SECURITY: {
    fa: "امنیت",
    en: "Security",
  },
  LOGIN: {
    fa: "ورود",
    en: "Login",
  },
  MFA: {
    fa: "احراز هویت چندمرحله‌ای",
    en: "Multi-Factor Authentication",
  },
  OTP: {
    fa: "رمز یک‌بارمصرف",
    en: "One-Time Password",
  },
  SESSION: {
    fa: "نشست کاربری",
    en: "Session",
  },
  DEVICE: {
    fa: "دستگاه",
    en: "Device",
  },
  BILLING: {
    fa: "مالی و پرداخت",
    en: "Billing",
  },
  TECHNICAL: {
    fa: "فنی",
    en: "Technical",
  },
  REPORT: {
    fa: "گزارش",
    en: "Report",
  },
  OTHER: {
    fa: "سایر",
    en: "Other",
  },
  CUSTOM_PLAN: {
    fa: "طرح سازمانی",
    en: "Custom Plan",
  },
  MIGRATION: {
    fa: "مهاجرت داده",
    en: "Migration",
  },
} as const satisfies Record<TicketCategory, Translation>

export const ticketMessageSenderTypeTranslations = {
  USER: {
    fa: "کاربر",
    en: "User",
  },
  ADMIN: {
    fa: "مدیر",
    en: "Admin",
  },
  SYSTEM: {
    fa: "سیستم",
    en: "System",
  },
} as const satisfies Record<TicketMessageSenderType, Translation>
