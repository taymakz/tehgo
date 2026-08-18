import type { PlaygroundDesign } from "./types"
import {
  TehgoHomeCover,
  TehgoLinesCover,
  TehgoMapCover,
  TehgoOfflineCover,
  TehgoRouteDetailCover,
  TehgoShowOnMapCover,
} from "./tehgo/covers"
import {
  TehgoHomeCoverWide,
  TehgoLinesCoverWide,
  TehgoMapCoverWide,
  TehgoOfflineCoverWide,
  TehgoRouteDetailCoverWide,
  TehgoShowOnMapCoverWide,
} from "./tehgo/covers-wide"

// Instagram feed-post dimensions — 4:5, never circle-cropped.
const POST = { width: 1080, height: 1350 }

// Myket/Cafebazaar "تصویر کاور" upload — true 16:9 landscape.
const WIDE = { width: 1920, height: 1080 }

// Add a new design by writing a .tsx component in this folder and
// registering it here — that's the whole workflow, no editor UI involved.
export const designs: PlaygroundDesign[] = [
  {
    id: "tehgo-home",
    label: "مسیریابی خانه — پست اینستاگرام",
    category: "post",
    group: "تهگو — نمای اپلیکیشن",
    ...POST,
    Component: TehgoHomeCover,
  },
  {
    id: "tehgo-route-detail",
    label: "جزئیات مسیر — پست اینستاگرام",
    category: "post",
    group: "تهگو — نمای اپلیکیشن",
    ...POST,
    Component: TehgoRouteDetailCover,
  },
  {
    id: "tehgo-show-on-map",
    label: "مسیر روی نقشه — پست اینستاگرام",
    category: "post",
    group: "تهگو — نمای اپلیکیشن",
    ...POST,
    Component: TehgoShowOnMapCover,
  },
  {
    id: "tehgo-map",
    label: "نقشه کامل — پست اینستاگرام",
    category: "post",
    group: "تهگو — نمای اپلیکیشن",
    ...POST,
    Component: TehgoMapCover,
  },
  {
    id: "tehgo-lines",
    label: "خطوط مترو — پست اینستاگرام",
    category: "post",
    group: "تهگو — نمای اپلیکیشن",
    ...POST,
    Component: TehgoLinesCover,
  },
  {
    id: "tehgo-offline",
    label: "کارکرد آفلاین — پست اینستاگرام",
    category: "post",
    group: "تهگو — نمای اپلیکیشن",
    ...POST,
    Component: TehgoOfflineCover,
  },

  // Myket/Cafebazaar store cover images — same content, 16:9 landscape.
  {
    id: "tehgo-home-wide",
    label: "مسیریابی خانه — کاور ۱۶:۹",
    category: "blog",
    group: "تهگو — کاور مایکت",
    ...WIDE,
    Component: TehgoHomeCoverWide,
  },
  {
    id: "tehgo-route-detail-wide",
    label: "جزئیات مسیر — کاور ۱۶:۹",
    category: "blog",
    group: "تهگو — کاور مایکت",
    ...WIDE,
    Component: TehgoRouteDetailCoverWide,
  },
  {
    id: "tehgo-show-on-map-wide",
    label: "مسیر روی نقشه — کاور ۱۶:۹",
    category: "blog",
    group: "تهگو — کاور مایکت",
    ...WIDE,
    Component: TehgoShowOnMapCoverWide,
  },
  {
    id: "tehgo-map-wide",
    label: "نقشه کامل — کاور ۱۶:۹",
    category: "blog",
    group: "تهگو — کاور مایکت",
    ...WIDE,
    Component: TehgoMapCoverWide,
  },
  {
    id: "tehgo-lines-wide",
    label: "خطوط مترو — کاور ۱۶:۹",
    category: "blog",
    group: "تهگو — کاور مایکت",
    ...WIDE,
    Component: TehgoLinesCoverWide,
  },
  {
    id: "tehgo-offline-wide",
    label: "کارکرد آفلاین — کاور ۱۶:۹",
    category: "blog",
    group: "تهگو — کاور مایکت",
    ...WIDE,
    Component: TehgoOfflineCoverWide,
  },
]
