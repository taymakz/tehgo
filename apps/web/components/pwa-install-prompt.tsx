"use client";

import { useEffect } from "react";
import { toastManager } from "@workspace/ui/components/toast";
import { useDictionary } from "@/i18n/dictionary-provider";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { MYKET_URL } from "@/lib/links";
import { MyketIcon } from "@/components/icons/myket-icon";
import { TehGoIcon } from "@/components/icons/tehgo-icon";

export function PwaInstallPrompt() {
  const dict = useDictionary();
  const { isInstallable, isInstalled, isAndroid, promptInstall } = usePwaInstall();

  useEffect(() => {
    if (isInstalled) return;

    if (isAndroid) {
      const timer = setTimeout(() => {
        toastManager.add({
          title: dict.pwa.installAndroidTitle,
          description: dict.pwa.installAndroidDescription,
          data: { variant: "x", avatar: <MyketIcon className="size-full" /> },
          actionProps: {
            children: dict.pwa.installAndroidAction,
            onClick: () => window.open(MYKET_URL, "_blank"),
          },
          timeout: 0,
        });
      }, 2000);
      return () => clearTimeout(timer);
    }

    if (isInstallable) {
      const timer = setTimeout(() => {
        toastManager.add({
          title: dict.pwa.installTitle,
          description: dict.pwa.installDescription,
          data: { variant: "x", avatar: <TehGoIcon className="size-full object-cover" /> },
          actionProps: {
            children: dict.pwa.installAction,
            onClick: () => void promptInstall(),
          },
          timeout: 0,
        });
      }, 2000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInstalled, isAndroid, isInstallable]);

  return null;
}
