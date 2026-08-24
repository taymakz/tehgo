"use client";

import { useEffect, useRef } from "react";
import type { IconFunction } from "reicon/createIcon";

export function ReiconIcon({
  icon: Icon,
  size = 16,
  className,
}: {
  icon: IconFunction;
  size?: number;
  className?: string;
}) {
  const hostRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const svg = Icon({ size, className });
    host.replaceChildren(svg);
  }, [Icon, size, className]);

  return <span ref={hostRef} aria-hidden="true" className="inline-flex shrink-0" />;
}
