import { useState } from "react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible"
import { ElasticSlider } from "@workspace/ui/components/elastic-slider"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@workspace/ui/components/select"
import type { ExportFormat } from "@/lib/export"
import type { DesignCategory, PlaygroundDesign } from "@/playground/types"

const CATEGORY_ICONS: Record<DesignCategory, string> = {
  blog: "icon-[lucide--newspaper]",
  instagram: "icon-[lucide--instagram]",
  post: "icon-[lucide--layout-grid]",
}

type DesignGroup = { group: string | undefined; items: PlaygroundDesign[] }

type StudioSidebarProps = {
  open: boolean
  onClose: () => void
  categories: { id: DesignCategory; label: string }[]
  category: DesignCategory
  onCategoryChange: (category: DesignCategory) => void
  groups: DesignGroup[]
  selectedId: string | undefined
  onSelect: (id: string) => void
  format: ExportFormat
  onFormatChange: (format: ExportFormat) => void
  quality: number
  onQualityChange: (quality: number) => void
  pixelRatio: number
  onPixelRatioChange: (pixelRatio: number) => void
  exporting: boolean
  exportingAll: boolean
  onExport: () => void
  onExportAll: () => void
  groupLabel: string | undefined
  groupCount: number
  lastExport: string | null
}

function DesignListItem({
  design,
  active,
  onSelect,
}: {
  design: PlaygroundDesign
  active: boolean
  onSelect: (id: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(design.id)}
      className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-start text-[13px] transition-colors ${
        active
          ? "bg-sky-500/15 font-medium text-sky-300"
          : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
      }`}
    >
      <span
        className={`icon-[lucide--image] size-3.5 shrink-0 ${active ? "opacity-100" : "opacity-40"}`}
      />
      <span className="truncate">{design.label}</span>
    </button>
  )
}

export function StudioSidebar({
  open,
  onClose,
  categories,
  category,
  onCategoryChange,
  groups,
  selectedId,
  onSelect,
  format,
  onFormatChange,
  quality,
  onQualityChange,
  pixelRatio,
  onPixelRatioChange,
  exporting,
  exportingAll,
  onExport,
  onExportAll,
  groupLabel,
  groupCount,
  lastExport,
}: StudioSidebarProps) {
  const busy = exporting || exportingAll
  const currentCategory = categories.find((c) => c.id === category)

  // Directory groups (highlight/post slide-sets) default expanded — this
  // tracks which ones the user has collapsed.
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    () => new Set()
  )

  function toggleGroup(group: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(group)) next.delete(group)
      else next.add(group)
      return next
    })
  }

  return (
    <>
      {/* Mobile backdrop — sidebar is an overlay below md, click through to dismiss. */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-black/60 backdrop-blur-[1px] transition-opacity duration-300 md:hidden ${
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed inset-y-0 start-0 z-40 flex h-full w-80 shrink-0 flex-col border-e border-white/10 bg-zinc-900 transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center gap-2.5 border-b border-white/10 px-4 py-3.5">
          <div className="flex size-7 items-center justify-center rounded-md bg-sky-500/15 text-sky-400">
            <span className="icon-[lucide--palette] size-4" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-white">Design Studio</div>
            <div className="truncate text-[11px] text-zinc-500">
              TehGo — تولید تصاویر شبکه‌های اجتماعی
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ms-auto flex size-7 items-center justify-center rounded-md text-zinc-400 hover:bg-white/5 hover:text-zinc-200 md:hidden"
          >
            <span className="icon-[lucide--x] size-4" />
          </button>
        </div>

        <div className="studio-scroll flex-1 overflow-y-auto">
          <div className="p-3">
            <Select
              value={category}
              onValueChange={(v) => v && onCategoryChange(v as DesignCategory)}
            >
              <SelectTrigger className="w-full">
                <span className="flex flex-1 items-center gap-2 text-start text-sm">
                  {currentCategory && (
                    <span
                      className={`${CATEGORY_ICONS[currentCategory.id]} size-3.5 text-sky-400`}
                    />
                  )}
                  {currentCategory?.label}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span
                        className={`${CATEGORY_ICONS[c.id]} size-3.5 opacity-70`}
                      />
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="px-3 pb-3">
            <div className="mb-1.5 px-1 text-[11px] font-medium tracking-wide text-zinc-500">
              طرح‌ها
            </div>
            <div className="flex flex-col gap-0.5">
              {groups.map(({ group, items }) => {
                if (!group) {
                  return (
                    <div key={items[0]?.id} className="flex flex-col gap-0.5">
                      {items.map((d) => (
                        <DesignListItem
                          key={d.id}
                          design={d}
                          active={d.id === selectedId}
                          onSelect={onSelect}
                        />
                      ))}
                    </div>
                  )
                }

                return (
                  <Collapsible
                    key={group}
                    open={!collapsedGroups.has(group)}
                    onOpenChange={() => toggleGroup(group)}
                    className="mt-2 first:mt-0"
                  >
                    <CollapsibleTrigger className="group flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-medium text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-300">
                      <span className="icon-[lucide--chevron-down] size-3 shrink-0 -rotate-90 transition-transform duration-200 group-data-[panel-open]:rotate-0" />
                      <span className="icon-[lucide--folder] size-3 shrink-0" />
                      <span className="flex-1 truncate text-start">
                        {group}
                      </span>
                      <span className="shrink-0 font-mono text-[10px] text-zinc-600">
                        {items.length}
                      </span>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="overflow-hidden transition-[height] duration-200 ease-out data-[ending-style]:h-0 data-[starting-style]:h-0">
                      <div className="flex flex-col gap-0.5 pt-0.5">
                        {items.map((d) => (
                          <DesignListItem
                            key={d.id}
                            design={d}
                            active={d.id === selectedId}
                            onSelect={onSelect}
                          />
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )
              })}
            </div>
          </div>
        </div>

        <div className="space-y-3 border-t border-white/10 p-3">
          <div className="mb-1 px-1 text-[11px] font-medium tracking-wide text-zinc-500">
            تنظیمات خروجی
          </div>

          <div className="flex items-center gap-0.5 rounded-lg border border-white/10 bg-white/5 p-1">
            {(["webp", "png"] as ExportFormat[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => onFormatChange(f)}
                className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                  format === f
                    ? "bg-white/10 text-white"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>

          <div
            className={`grid transition-[grid-template-rows] duration-200 ease-out ${
              format === "webp" ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            }`}
          >
            <div className="overflow-hidden">
              {/* dir="ltr" — the slider's drag math and handle position are
                  physically left-anchored (not logical), so under an RTL
                  ancestor the fill bar and handle visually move in opposite
                  directions. Force LTR here to keep them in sync. */}
              <div dir="ltr" className="pt-0.5 pb-1">
                <ElasticSlider
                  label="کیفیت"
                  min={0.5}
                  max={1}
                  step={0.01}
                  value={quality}
                  onValueChange={onQualityChange}
                  formatValue={(v) => `${Math.round(v * 100)}%`}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <label htmlFor="pixel-ratio" className="text-xs text-zinc-400">
              نسبت پیکسل
            </label>
            <input
              id="pixel-ratio"
              type="number"
              min={1}
              max={4}
              value={pixelRatio}
              onChange={(e) => onPixelRatioChange(Number(e.target.value) || 1)}
              className="w-16 rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-end text-sm text-zinc-100 outline-none focus:border-sky-400"
            />
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={onExport}
            className="flex w-full items-center justify-center gap-1.5 rounded-md bg-sky-500 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-400 disabled:opacity-50"
          >
            <span className="icon-[lucide--download] size-4" />
            {exporting ? "در حال خروجی..." : "خروجی گرفتن"}
          </button>

          <div
            className={`grid transition-[grid-template-rows] duration-200 ease-out ${
              groupCount > 1 ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            }`}
          >
            <div className="overflow-hidden">
              <button
                type="button"
                disabled={busy}
                onClick={onExportAll}
                title={`رندر و دانلود همه اسلایدهای «${groupLabel}» در یک فایل ZIP`}
                className="flex w-full items-center justify-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3.5 py-2 text-sm font-medium text-zinc-100 transition-colors hover:bg-white/10 disabled:opacity-50"
              >
                <span className="icon-[lucide--folder-archive] size-4" />
                {exportingAll
                  ? "در حال آماده‌سازی..."
                  : `خروجی همه (${groupCount}) — ZIP`}
              </button>
            </div>
          </div>

          {lastExport && (
            <div className="flex items-center gap-1.5 rounded-md border border-white/10 bg-black/20 px-2.5 py-1.5 font-mono text-[11px] text-zinc-400">
              {lastExport.startsWith("خطا") ? (
                <span className="icon-[lucide--alert-triangle] size-3 shrink-0 text-red-400" />
              ) : (
                <span className="icon-[lucide--check] size-3 shrink-0 text-emerald-400" />
              )}
              <span className="truncate">{lastExport}</span>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
