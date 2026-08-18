import { useEffect, useRef, useState } from "react"
import { StudioSidebar } from "@/components/studio-sidebar"
import {
  downloadBlob,
  exportNodeToBlob,
  formatBytes,
  type ExportFormat,
} from "@/lib/export"
import { zipFiles } from "@/lib/zip"
import { designs } from "@/playground/registry"
import type { DesignCategory } from "@/playground/types"

const PADDING = 48

const CATEGORIES: { id: DesignCategory; label: string }[] = [
  { id: "post", label: "پست اینستاگرام" },
  { id: "blog", label: "کاور مایکت (۱۶:۹)" },
]

// Deep-link support: /?design=<id> opens the studio on that design.
function designFromUrl() {
  const id = new URLSearchParams(window.location.search).get("design")
  return designs.find((d) => d.id === id) ?? designs[0]
}

export default function App() {
  const [category, setCategory] = useState<DesignCategory>(
    () => designFromUrl()?.category ?? "post"
  )
  const categoryDesigns = designs.filter((d) => d.category === category)

  const [selectedId, setSelectedId] = useState(() => designFromUrl()?.id)
  const design =
    categoryDesigns.find((d) => d.id === selectedId) ?? categoryDesigns[0]

  // Keep the highlight's slides together in the sidebar — designs without a
  // group render as flat items (the blog covers).
  const groups: { group: string | undefined; items: typeof designs }[] = []
  for (const d of categoryDesigns) {
    const last = groups[groups.length - 1]
    if (last && last.group === d.group) last.items.push(d)
    else groups.push({ group: d.group, items: [d] })
  }

  function switchCategory(next: DesignCategory) {
    setCategory(next)
    const first = designs.find((d) => d.category === next)
    if (first) setSelectedId(first.id)
  }

  const viewportRef = useRef<HTMLDivElement>(null)
  const nodeRef = useRef<HTMLDivElement>(null)
  const scale = useRef(1)
  const [, forceRender] = useState(0)

  const [sidebarOpen, setSidebarOpen] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 768
  )

  const [format, setFormat] = useState<ExportFormat>("webp")
  const [quality, setQuality] = useState(0.92)
  const [pixelRatio, setPixelRatio] = useState(2)
  const [exporting, setExporting] = useState(false)
  const [exportingAll, setExportingAll] = useState(false)
  const [lastExport, setLastExport] = useState<string | null>(null)

  // Slides that share this design's group (e.g. all children of an
  // Instagram highlight) — used by "export all" to batch them into one zip.
  const groupItems = design.group
    ? categoryDesigns.filter((d) => d.group === design.group)
    : null

  useEffect(() => {
    function recompute() {
      const el = viewportRef.current
      if (!el || !design) return
      const availW = el.clientWidth - PADDING * 2
      const availH = el.clientHeight - PADDING * 2
      const next = Math.min(availW / design.width, availH / design.height, 1)
      scale.current = next > 0 ? next : 1
      forceRender((t) => t + 1)
    }
    recompute()
    window.addEventListener("resize", recompute)
    return () => window.removeEventListener("resize", recompute)
  }, [design])

  // Keep ?design=<id> in sync with whatever's selected — category switches
  // and list clicks alike, not just the initial deep link — so a refresh (or
  // a copied/shared link) lands back on exactly this design. replaceState
  // (not push) so browser back doesn't have to step through every design
  // clicked in a session.
  useEffect(() => {
    if (!design) return
    const params = new URLSearchParams(window.location.search)
    if (params.get("design") === design.id) return
    params.set("design", design.id)
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}?${params.toString()}`
    )
  }, [design])

  async function handleExport() {
    const node = nodeRef.current
    if (!node || !design) return
    setExporting(true)
    try {
      const blob = await exportNodeToBlob(node, { format, quality, pixelRatio })
      downloadBlob(blob, `${design.id}.${format}`)
      setLastExport(`${formatBytes(blob.size)} · ${format.toUpperCase()}`)
    } catch (err) {
      console.error(err)
      setLastExport("خطا در خروجی گرفتن")
    } finally {
      setExporting(false)
    }
  }

  // Waits for the design switch (setSelectedId) to actually reach the
  // screen: one frame for React to commit the new Component, one more for
  // the browser to paint it, so nodeRef.current is guaranteed to be the
  // slide we just selected — not the previous one.
  function nextFrame() {
    return new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve())
    )
  }

  async function handleExportAll() {
    if (!groupItems || groupItems.length === 0) return
    const originalId = design.id
    setExportingAll(true)
    try {
      const files: { name: string; blob: Blob }[] = []
      for (let i = 0; i < groupItems.length; i++) {
        const item = groupItems[i]
        setSelectedId(item.id)
        await nextFrame()
        await nextFrame()
        const node = nodeRef.current
        if (!node) continue
        const blob = await exportNodeToBlob(node, {
          format,
          quality,
          pixelRatio,
        })
        files.push({ name: `${item.id}.${format}`, blob })
        setLastExport(`رندر ${i + 1} از ${groupItems.length} · ${item.label}`)
      }
      setLastExport("در حال فشرده‌سازی...")
      const zipBlob = await zipFiles(files)
      downloadBlob(zipBlob, `${design.group}.zip`)
      setLastExport(`${files.length} فایل · ${formatBytes(zipBlob.size)} ZIP`)
    } catch (err) {
      console.error(err)
      setLastExport("خطا در خروجی گرفتن")
    } finally {
      setSelectedId(originalId)
      setExportingAll(false)
    }
  }

  if (!design) {
    return (
      <div className="flex h-dvh items-center justify-center bg-zinc-950 text-sm text-zinc-500">
        هیچ طرحی در src/playground/registry.ts ثبت نشده.
      </div>
    )
  }

  return (
    <div className="flex h-dvh bg-zinc-950 text-zinc-100">
      <StudioSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        categories={CATEGORIES}
        category={category}
        onCategoryChange={switchCategory}
        groups={groups}
        selectedId={design.id}
        onSelect={setSelectedId}
        format={format}
        onFormatChange={setFormat}
        quality={quality}
        onQualityChange={setQuality}
        pixelRatio={pixelRatio}
        onPixelRatioChange={setPixelRatio}
        exporting={exporting}
        exportingAll={exportingAll}
        onExport={handleExport}
        onExportAll={handleExportAll}
        groupLabel={design.group}
        groupCount={groupItems?.length ?? 0}
        lastExport={lastExport}
      />

      {/* Reserves the sidebar's width in the desktop flex row so the fixed,
          translating <aside> lines up with normal-flow layout instead of
          overlaying content — collapses smoothly when the sidebar closes. */}
      <div
        className={`hidden shrink-0 transition-[width] duration-300 ease-in-out md:block ${
          sidebarOpen ? "w-80" : "w-0"
        }`}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-3 border-b border-white/10 bg-zinc-900 px-4 py-2.5">
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-200"
            title="نمایش/پنهان‌کردن نوار کناری"
          >
            <span className="icon-[lucide--panel-left] size-4 rtl:rotate-180" />
          </button>
          <div className="min-w-0 truncate text-sm font-medium text-zinc-200">
            {design.label}
          </div>
          <span className="ms-auto shrink-0 font-mono text-xs text-zinc-500">
            {design.width}×{design.height}
          </span>
        </div>

        {/* dir="ltr" resets bidi/logical-property inheritance at the canvas
            boundary — the studio chrome is RTL, but the exported designs
            were authored assuming an LTR ancestor and must render/rasterize
            identically regardless of the shell's direction. */}
        <div
          ref={viewportRef}
          dir="ltr"
          className="relative flex flex-1 items-center justify-center overflow-auto bg-[radial-gradient(circle,#27272a_1px,transparent_1px)] [background-size:20px_20px]"
        >
          <div
            key={design.id}
            className="studio-canvas-enter"
            style={{
              width: design.width * scale.current,
              height: design.height * scale.current,
            }}
          >
            <div
              style={{
                width: design.width,
                height: design.height,
                transform: `scale(${scale.current})`,
                transformOrigin: "top left",
              }}
              className="shadow-2xl"
            >
              <div
                ref={nodeRef}
                style={{ width: design.width, height: design.height }}
              >
                <design.Component />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
