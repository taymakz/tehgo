import { tehgoSlides } from "./content"
import { makeScreenshotCoverWide } from "./screenshot-cover-wide"

// 16:9 landscape covers for Myket/Cafebazaar's "تصویر کاور" upload.
export const TehgoHomeCoverWide = makeScreenshotCoverWide(tehgoSlides.home)
export const TehgoRouteDetailCoverWide = makeScreenshotCoverWide(
  tehgoSlides.routeDetail
)
export const TehgoShowOnMapCoverWide = makeScreenshotCoverWide(
  tehgoSlides.showOnMap
)
export const TehgoMapCoverWide = makeScreenshotCoverWide(tehgoSlides.map)
export const TehgoLinesCoverWide = makeScreenshotCoverWide(tehgoSlides.lines)
export const TehgoOfflineCoverWide = makeScreenshotCoverWide(
  tehgoSlides.offline
)
