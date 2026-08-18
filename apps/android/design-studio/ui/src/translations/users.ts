import type { UserStatus } from "@workspace/db/schema"
import { Translation } from "./shared.js"

export const userStatusTranslations = {
  ACTIVE: {
    fa: "فعال",
    en: "Active",
  },
  SUSPENDED: {
    fa: "معلق",
    en: "Suspended",
  },
} as const satisfies Record<UserStatus, Translation>
