"use client"

import type { ComponentProps } from "react"
import { Button } from "@workspace/ui/components/button"
import { toastManager } from "@workspace/ui/components/toast"
import { useCopyToClipboard } from "@workspace/ui/hooks/use-copy-to-clipboard"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"

export type ShareMenuProps = {
  /** Title passed to the native share sheet. */
  title: string
  /** URL to share. Relative URLs are resolved against the current origin. */
  url: string
  /** When set, adds a "Copy as Markdown" item that copies this text instead of the URL. */
  markdown?: string
}

// Ported from the ncdai/share-menu recipe onto this repo's own primitives —
// Base UI DropdownMenu instead of Radix, the shared toastManager instead of
// sonner, and useCopyToClipboard (already used by CopyButton) instead of a
// bespoke clipboard call.
export function ShareMenu({ title, url, markdown }: ShareMenuProps) {
  const { copy: copyLink } = useCopyToClipboard({
    onCopySuccess: () =>
      toastManager.add({ title: "لینک کپی شد", type: "success" }),
    onCopyError: () =>
      toastManager.add({ title: "خطا در کپی لینک", type: "error" }),
  })

  const { copy: copyMarkdown } = useCopyToClipboard({
    onCopySuccess: () =>
      toastManager.add({ title: "مارک‌داون کپی شد", type: "success" }),
    onCopyError: () =>
      toastManager.add({ title: "خطا در کپی مارک‌داون", type: "error" }),
  })

  const absoluteUrl = url.startsWith("http")
    ? url
    : typeof window !== "undefined"
      ? new URL(url, window.location.origin).toString()
      : url

  const urlEncoded = encodeURIComponent(absoluteUrl)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="icon-sm" aria-label="اشتراک‌گذاری" />
        }
      >
        <span aria-hidden className="icon-[lucide--share-2] size-4" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" alignOffset={-6} className="w-40">
        <DropdownMenuItem onClick={() => copyLink(absoluteUrl)}>
          <span aria-hidden className="icon-[lucide--link] size-4" />
          کپی لینک
        </DropdownMenuItem>

        {markdown && (
          <DropdownMenuItem onClick={() => copyMarkdown(markdown)}>
            <span aria-hidden className="icon-[lucide--file-text] size-4" />
            کپی مارک‌داون
          </DropdownMenuItem>
        )}

        <DropdownMenuItem
          render={
            <a
              href={`https://x.com/intent/tweet?url=${urlEncoded}`}
              target="_blank"
              rel="noopener"
            />
          }
        >
          <XIcon className="size-4" />
          اشتراک در X
        </DropdownMenuItem>

        <DropdownMenuItem
          render={
            <a
              href={`https://www.linkedin.com/sharing/share-offsite?url=${urlEncoded}`}
              target="_blank"
              rel="noopener"
            />
          }
        >
          <LinkedInIcon className="size-4" />
          اشتراک در لینکدین
        </DropdownMenuItem>

        {typeof navigator !== "undefined" && "share" in navigator && (
          <DropdownMenuItem
            onClick={(e) => {
              e.preventDefault()
              navigator.share({ title, url: absoluteUrl }).catch(() => {})
            }}
          >
            <span aria-hidden className="icon-[lucide--ellipsis] size-4" />
            سایر برنامه‌ها
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function XIcon(props: ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      <path
        d="m22.991 23-8.533-12.612L22.42 1h-2.77l-6.422 7.575L8.105 1H1.123l8.225 12.158L1 23h2.77l6.81-8.03L16.015 23H23zM7.193 2.769l12.49 18.462h-2.76L4.43 2.769z"
        fill="currentColor"
      />
    </svg>
  )
}

function LinkedInIcon(props: ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      <path
        d="M22.274 0H1.728C.692 0 0 .685 0 1.715v20.569C0 23.316.864 24 1.727 24h20.546C23.31 24 24 23.315 24 22.285V1.716C24.001.684 23.31 0 22.274 0M7.08 20.4H3.454V8.915h3.625zM5.352 7.371c-1.209 0-2.07-.856-2.07-2.056s.863-2.059 2.07-2.059c1.21 0 2.073.859 2.073 2.059S6.388 7.37 5.352 7.37M20.548 20.4h-3.626v-5.485c0-1.371 0-3.087-1.9-3.087-1.898 0-2.073 1.372-2.073 2.916V20.4H9.325V8.915h3.454v1.541c.69-1.2 2.073-1.885 3.453-1.885 3.627 0 4.316 2.4 4.316 5.485z"
        fill="currentColor"
      />
    </svg>
  )
}
