import {
  AuditLogActorType,
  AuditLogDomain,
  AuditLogOutcome,
} from "@workspace/db/schema"
import { Translation } from "./shared.js"

export const auditLogDomainTranslations = {
  AUTH: {
    fa: "احراز هویت",
    en: "Authentication",
  },
  USER: {
    fa: "کاربر",
    en: "User",
  },
  SESSION: {
    fa: "نشست",
    en: "Session",
  },
  SECURITY: {
    fa: "امنیت",
    en: "Security",
  },
  ACCESS: {
    fa: "دسترسی",
    en: "Access",
  },
  ADMIN: {
    fa: "ادمین",
    en: "Admin",
  },
  SYSTEM: {
    fa: "سیستم",
    en: "System",
  },
} as const satisfies Record<AuditLogDomain, Translation>

export const auditLogActorTypeTranslations = {
  USER: {
    fa: "کاربر",
    en: "User",
  },
  ADMIN: {
    fa: "ادمین",
    en: "Admin",
  },
  SYSTEM: {
    fa: "سیستم",
    en: "System",
  },
  SERVICE: {
    fa: "سرویس",
    en: "Service",
  },
  ANONYMOUS: {
    fa: "ناشناس",
    en: "Anonymous",
  },
  SUPPORT: {
    fa: "پشتیبانی",
    en: "Support",
  },
} as const satisfies Record<AuditLogActorType, Translation>

export const auditLogOutcomeTranslations = {
  SUCCESS: {
    fa: "موفق",
    en: "Success",
  },
  FAILURE: {
    fa: "ناموفق",
    en: "Failure",
  },
  DENIED: {
    fa: "رد شده",
    en: "Denied",
  },
  ERROR: {
    fa: "خطا",
    en: "Error",
  },
} as const satisfies Record<AuditLogOutcome, Translation>
