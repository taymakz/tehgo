import { tehgoSlides } from "./content"
import { makeScreenshotCover } from "./screenshot-cover"

// Portrait 4:5 Instagram-feed-post covers.
export const TehgoHomeCover = makeScreenshotCover(tehgoSlides.home)
export const TehgoRouteDetailCover = makeScreenshotCover(
  tehgoSlides.routeDetail
)
export const TehgoShowOnMapCover = makeScreenshotCover(tehgoSlides.showOnMap)
export const TehgoMapCover = makeScreenshotCover(tehgoSlides.map)
export const TehgoLinesCover = makeScreenshotCover(tehgoSlides.lines)
export const TehgoOfflineCover = makeScreenshotCover(tehgoSlides.offline)
