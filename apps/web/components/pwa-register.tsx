"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      // A new service worker has just taken control (it calls
      // self.skipWaiting() + clients.claim() on activate) — reload once so
      // the page picks up the new version instead of running stale JS
      // against a freshly-swapped cache.
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    navigator.serviceWorker.register("/sw.js").then((registration) => {
      // Proactively check for a new version whenever the tab regains focus,
      // in addition to the browser's own periodic checks.
      const checkForUpdate = () => registration.update().catch(() => {});
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") checkForUpdate();
      });
      window.addEventListener("focus", checkForUpdate);
    }).catch(() => {});
  }, []);

  return null;
}
