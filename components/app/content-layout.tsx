"use client";

import { cn } from "@/lib/utils";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

export default function ContentLayout({ children, className }: { children: React.ReactNode, className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Track scroll relative to the container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 30px", "start start"],
  });

  // Transform scroll progress to border radius (32px -> 0px)
  const borderRadius = useTransform(scrollYProgress, [0, 1], [32, 0]);

  // Transform scroll progress to span width (56px -> 100%)
  const spanWidth = useTransform(scrollYProgress, [0, 1], ["56px", "72px"]);

  return (
    <div ref={containerRef} className={cn('min-h-dvh -mt-6  pb-26 bg-background', className)}>
      {/* Thumb */}
      <motion.div
        className="sticky top-0 flex items-center justify-center w-full py-2.5 bg-background z-10 "
        style={{
          borderTopLeftRadius: borderRadius,
          borderTopRightRadius: borderRadius,
        }}
      >
        <motion.span
          className="h-1 rounded-full bg-foreground/50 block"
          style={{
            width: spanWidth,
          }}
        />
      </motion.div>
      {children}
    </div>
  );
}
