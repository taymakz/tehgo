import { useMediaQuery } from "usehooks-ts";

export function useIsDesktop() {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  return isDesktop;
}
export function useIsMobile() {
  const isMobile = useMediaQuery("(max-width: 767px)");
  return isMobile;
}
