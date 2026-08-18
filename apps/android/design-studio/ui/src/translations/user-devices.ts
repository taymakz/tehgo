import type { DevicePlatform } from "@workspace/db/schema"
import { Translation } from "./shared.js"

export const devicePlatformTranslations = {
  IOS: { fa: "آی‌اواس", en: "iOS" },
  ANDROID: { fa: "اندروید", en: "Android" },
  WEB: { fa: "وب", en: "Web" },
  DESKTOP: { fa: "دسکتاپ", en: "Desktop" },
  OTHER: { fa: "سایر", en: "Other" },
} as const satisfies Record<DevicePlatform, Translation>
