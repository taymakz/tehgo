import { toCanvas } from "html-to-image"

export type ExportFormat = "png" | "webp"

export type ExportOptions = {
  format: ExportFormat
  /** 0..1, only meaningful for webp — png is always lossless. */
  quality: number
  /** Render at 1x/2x/3x the CSS pixel size for crisper output. */
  pixelRatio: number
}

// Renders the DOM node to an actual <canvas> (not straight to a blob) so we
// can pick PNG (lossless) vs WebP (lossy, quality-controlled) at the very
// last step — canvas.toBlob is what actually owns the compression,
// html-to-image just rasterizes the DOM once.
export async function exportNodeToBlob(
  node: HTMLElement,
  { format, quality, pixelRatio }: ExportOptions
): Promise<Blob> {
  const canvas = await toCanvas(node, {
    pixelRatio,
    // The rasterization step renders the cloned DOM inside an <img>-loaded
    // SVG, a separate resource context that doesn't inherit this page's
    // already-loaded @font-face rules — so the font-embedding pass (i.e.
    // NOT skipping fonts) is required for Geist/Vazirmatn to actually show
    // up in the exported image instead of silently falling back to system
    // fonts. Slower, but correct.
    skipFonts: false,
    cacheBust: true,
  })

  const mime = format === "webp" ? "image/webp" : "image/png"

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error("Canvas export produced an empty blob"))
      },
      mime,
      format === "webp" ? quality : undefined
    )
  })
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}
