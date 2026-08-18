"use client"

import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { EASE_OUT } from "@workspace/ui/lib/ease"
import { cn } from "@workspace/ui/lib/utils"

type IslandContextValue = {
  view: string | null
}

const IslandContext = createContext<IslandContextValue | null>(null)

const SHELL_SPRING = {
  type: "spring",
  duration: 0.42,
  bounce: 0.15,
} as const

const CONTENT_SPRING = {
  type: "spring",
  duration: 0.42,
  bounce: 0.22,
} as const

const RADIUS = 32

const PILL_WIDTH = 110
const PILL_HEIGHT = 36

function useContentSize() {
  const ref = useRef<HTMLDivElement | null>(null)
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null
  )

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setSize({ width: el.offsetWidth, height: el.offsetHeight })
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(() => {
      setSize({ width: el.offsetWidth, height: el.offsetHeight })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return [ref, size] as const
}

function Slot({
  keyId,
  children,
  className,
}: {
  keyId: string
  children: ReactNode
  className?: string
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      key={keyId}
      initial={
        reduce
          ? { opacity: 0, filter: "blur(0px)" }
          : { opacity: 0, scale: 0.9, y: -8, filter: "blur(5px)" }
      }
      animate={
        reduce
          ? { opacity: 1, filter: "blur(0px)" }
          : { opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }
      }
      exit={
        reduce
          ? { opacity: 0, filter: "blur(0px)", transition: { duration: 0.1 } }
          : {
              opacity: 0,
              scale: 0.9,
              y: -6,
              filter: "blur(0px)",
              transition: { duration: 0.08, ease: EASE_OUT },
            }
      }
      transition={reduce ? { duration: 0.15 } : CONTENT_SPRING}
      style={{
        transformOrigin: "top center",
        willChange: "transform, opacity, filter",
      }}
      className={cn("flex items-center justify-center", className)}
    >
      {children}
    </motion.div>
  )
}

export interface DynamicIslandProps {
  view: string | null
  compact?: ReactNode
  children?: ReactNode
  className?: string
}

export function DynamicIsland({
  view,
  compact,
  children,
  className,
}: DynamicIslandProps) {
  const reduce = useReducedMotion()
  const expanded = view !== null
  const [sizerRef, size] = useContentSize()

  return (
    <IslandContext.Provider value={{ view }}>
      <motion.div
        role="status"
        aria-live="polite"
        initial={false}
        animate={
          expanded && size
            ? { width: size.width, height: size.height }
            : { width: PILL_WIDTH, height: PILL_HEIGHT }
        }
        transition={reduce ? { duration: 0 } : SHELL_SPRING}
        style={{ borderRadius: RADIUS }}
        className={cn(
          "relative inline-flex items-start justify-center overflow-hidden",
          "bg-popover text-popover-foreground shadow-2xl",
          className
        )}
      >
        <div ref={sizerRef} className="w-max">
          <AnimatePresence mode="popLayout" initial={false}>
            {!expanded && compact ? (
              <Slot keyId="compact">{compact}</Slot>
            ) : null}
          </AnimatePresence>
          {children}
        </div>
      </motion.div>
    </IslandContext.Provider>
  )
}

export interface DynamicIslandViewProps {
  id: string
  children: ReactNode
  className?: string
}

export function DynamicIslandView({
  id,
  children,
  className,
}: DynamicIslandViewProps) {
  const ctx = useContext(IslandContext)
  if (!ctx)
    throw new Error("DynamicIslandView must be used inside <DynamicIsland>")
  const active = ctx.view === id

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      {active ? (
        <Slot keyId={id} className={cn("px-0 py-0", className)}>
          {children}
        </Slot>
      ) : null}
    </AnimatePresence>
  )
}
