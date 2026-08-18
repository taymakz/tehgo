import type { WalletCardBankName } from "@workspace/db/schema"

/**
 * Persian display labels for `walletCardBankNameEnum` (packages/db/src/schema/platform-wallet-cards.ts).
 * Lives here rather than in @workspace/db because that package is a pure
 * schema/seed library with no UI/display concerns — this is presentation data.
 *
 * Moved out of packages/db/src/schema/platform-wallet-cards.ts (2026-07). Note:
 * apps/panel and apps/website each still keep their own local copy of this map
 * (apps/panel/lib/wallet-card-labels.ts, apps/website/lib/wallet-card-labels.ts)
 * and apps/admin has two inline `bankLabel()` duplicates — consolidating all of
 * those onto this shared copy is a follow-up, not done as part of this change.
 */
export const WALLET_CARD_BANK_NAME_LABELS: Record<WalletCardBankName, string> =
  {
    EGHTESAD_NOVIN: "اقتصاد نوین",
    BLUBANK: "بلوبانک",
    TOSSE_E_TAAVON: "توسعه تعاون",
    PARSIAN: "پارسیان",
    MELLI: "ملت",
    SADERAT: "صادرات",
    PASARGAD: "پاسارگاد",
    POSTBANK: "پست بانک ایران",
    TEJARAT: "تجارت",
    MOASSSE_TAAVON: "موسسه‌اعتباری توسعه",
    TOSSE_SADARAT: "توسعه صادرات",
    REFAH: "رفاه",
    SAMAN: "سامان",
    SEPEH: "سپه",
    SARMAYE: "سرمایه",
    SANAT_VA_MADAN: "صنعت و معدن",
    KARAFARIN: "کارآفرین",
    KESHAWARI: "کشاورزی",
    MASKAN: "مسکن",
    MELLI_IRAN: "ملی ایران",
    SINA: "سینا",
    SHAHR: "شهر",
    ANSAR: "انصار",
    IRAN_ZAMIN: "ایران زمین",
    RESALAT: "رسالت",
    GARDESHGARI: "گردشگری",
    GHARZ_ALHESANEH: "قرض‌الحسنه مهر ایران",
    KOSAR: "کوثر",
    AYANDEH: "آینده",
    HEKMAT_IRANIAN: "حکمت ایرانیان",
    DEY: "دی",
    MEHR_EGHTESAD: "مهر اقتصاد",
    MELLAL: "موسسه اعتباری ملل",
    OTHER: "سایر",
  }
