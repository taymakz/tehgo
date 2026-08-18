"use client"

import { useEffect, useMemo, useState } from "react"
import { cn } from "@workspace/ui/lib/utils"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@workspace/ui/components/hover-card"

export type TOCItemType = {
  title: React.ReactNode
  url: string
  depth: number
}

export type TOCMinimapProps = {
  items: TOCItemType[]
  className?: string
}

// Ported from the ncdai/toc-minimap recipe onto this repo's own Base UI
// HoverCard (the source recipe targets Radix) — sound effect dependency
// dropped since it isn't used anywhere else in this codebase.
export function TOCMinimap({ items, className }: TOCMinimapProps) {
  const itemIds = useMemo(
    () => items.map((item) => item.url.replace("#", "")),
    [items]
  )

  const activeHeading = useActiveHeading(itemIds)

  if (!items.length) {
    return null
  }

  return (
    <div className={cn("w-18", className)}>
      <HoverCard>
        <HoverCardTrigger
          render={
            <div
              tabIndex={0}
              aria-label="فهرست مطالب"
              className="flex max-h-[50dvh] flex-col gap-3 overflow-hidden py-3 ps-6 opacity-100 transition-opacity duration-200 focus-visible:outline-none data-popup-open:opacity-0"
            />
          }
        >
          {items.map((item) => (
            <div
              key={item.url}
              aria-hidden
              data-depth={item.depth}
              data-active={item.url === `#${activeHeading}`}
              className={cn(
                "h-0.5 w-6 shrink-0 rounded-xs bg-ring/50 transition-[background-color] duration-200",
                "data-[depth=3]:ms-2 data-[depth=3]:w-4",
                "data-[depth=4]:ms-4 data-[depth=4]:w-2",
                "data-active:bg-foreground"
              )}
            />
          ))}
        </HoverCardTrigger>

        {/* Positioned to expand toward the reading-start side (right in
            RTL, left in LTR) regardless of document direction. */}
        <HoverCardContent
          className="w-56 overflow-hidden p-0 duration-200 data-[side=inline-start]:slide-in-from-end-3 data-[side=inline-start]:slide-out-to-end-3"
          align="start"
          alignOffset={0}
          side="inline-start"
          sideOffset={-60}
        >
          <div className="flex max-h-[50dvh] overflow-y-auto overscroll-contain">
            <ul className="flex size-full flex-col px-6 py-4 text-sm">
              {items.map((item) => (
                <li key={item.url} className="flex py-1">
                  <a
                    href={item.url}
                    data-depth={item.depth}
                    data-active={item.url === `#${activeHeading}`}
                    className={cn(
                      "line-clamp-2 w-full text-pretty transition-colors duration-200",
                      "text-muted-foreground hover:text-foreground data-active:text-foreground",
                      "data-[depth=3]:ps-4 data-[depth=4]:ps-8"
                    )}
                    onClick={handleItemClick}
                  >
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </HoverCardContent>
      </HoverCard>
    </div>
  )
}

export function useActiveHeading(itemIds: string[]) {
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        }
      },
      { rootMargin: "0% 0% -80% 0%", threshold: 0.98 }
    )

    for (const id of itemIds) {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    }

    return () => {
      for (const id of itemIds) {
        const element = document.getElementById(id)
        if (element) observer.unobserve(element)
      }
    }
  }, [itemIds])

  return activeId
}

function handleItemClick(e: React.MouseEvent<HTMLAnchorElement>) {
  e.preventDefault()
  const url = e.currentTarget.getAttribute("href") ?? ""
  scrollToHeading(url)
}

function scrollToHeading(url: string) {
  history.pushState(null, "", url)
  document.getElementById(url.replace("#", ""))?.scrollIntoView({
    behavior: "smooth",
  })
}
