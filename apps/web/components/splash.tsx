"use client";

import { cn } from "@workspace/ui/lib/utils";

export function Splash({ show }: { show: boolean }) {
  return (
    <div
      aria-hidden={!show}
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0a] transition-opacity duration-500",
        show ? "opacity-100" : "pointer-events-none opacity-0"
      )}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        className="size-14 animate-pulse text-white"
      >
        <path
          fill="currentColor"
          d="M3.16496 19.5025L10.5275 2.99281C11.1178 1.66906 12.8822 1.66906 13.4725 2.99281L20.835 19.5025C21.5021 20.9984 20.0209 22.5499 18.6331 21.809L12.7294 18.657C12.2702 18.4118 11.7298 18.4118 11.2706 18.657L5.36689 21.809C3.97914 22.5499 2.49789 20.9984 3.16496 19.5025Z"
        />
      </svg>
    </div>
  );
}
