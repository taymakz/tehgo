"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Hook to detect if virtual keyboard is visible on mobile devices
 * @param threshold - Height difference in pixels to consider keyboard as open (default: 150)
 * @returns boolean indicating if keyboard is currently visible
 */
export function useKeyboardVisible(threshold = 150): boolean {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const initialViewportHeight = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Store initial viewport height
    initialViewportHeight.current =
      window.visualViewport?.height || window.innerHeight;

    const handleViewportChange = () => {
      const currentHeight = window.visualViewport?.height || window.innerHeight;
      const heightDifference = initialViewportHeight.current - currentHeight;

      // If viewport height decreased by more than threshold, keyboard is likely open
      setIsKeyboardVisible(heightDifference > threshold);
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleViewportChange);
      return () =>
        window.visualViewport?.removeEventListener(
          "resize",
          handleViewportChange,
        );
    } else {
      window.addEventListener("resize", handleViewportChange);
      return () => window.removeEventListener("resize", handleViewportChange);
    }
  }, [threshold]);

  return isKeyboardVisible;
}
