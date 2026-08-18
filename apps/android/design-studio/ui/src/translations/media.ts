import type { MediaContext, MediaType } from "@workspace/db/schema"
import { Translation } from "./shared.js"
export const mediaTypeTranslations = {
  IMAGE: {
    fa: "تصویر",
    en: "Image",
  },
  VIDEO: {
    fa: "ویدیو",
    en: "Video",
  },
} as const satisfies Record<MediaType, Translation>

export const mediaContextTranslations = {
  USER_AVATAR: { fa: "آواتار کاربر", en: "User Avatar" },
  TICKET_ATTACHMENT: { fa: "پیوست تیکت", en: "Ticket Attachment" },
  FEEDBACK_ATTACHMENT: { fa: "پیوست بازخورد", en: "Feedback Attachment" },
  CAFE_LOGO_LIGHT: { fa: "لوگو کافه (روشن)", en: "Cafe Logo Light" },
  CAFE_LOGO_DARK: { fa: "لوگو کافه (تاریک)", en: "Cafe Logo Dark" },
  CAFE_BANNER: { fa: "بنر کافه", en: "Cafe Banner" },
  BRANCH_BANNER: { fa: "بنر شعبه", en: "Branch Banner" },
  PRODUCT_IMAGE: { fa: "تصویر محصول", en: "Product Image" },
  PRODUCT_VIDEO: { fa: "ویدیو محصول", en: "Product Video" },
  MENU_CATEGORY_IMAGE: { fa: "تصویر دسته‌بندی منو", en: "Menu Category Image" },
  FLOOR_BACKGROUND: { fa: "پس‌زمینه طبقه", en: "Floor Background" },
} as const satisfies Record<MediaContext, Translation>
