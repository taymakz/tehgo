import type { ComponentType } from "react"

// Top-level pages in the playground bar. "blog" holds the 1200×630 post
// covers / OG images; "instagram" holds highlight covers (1080×1080 circles)
// and story slides (1080×1920); "post" holds feed-carousel slides (1080×1350,
// never circle-cropped, swiped left instead of tapped like a story).
export type DesignCategory = "blog" | "instagram" | "post"

// A "design" is just a plain TSX component — no visual editor, no schema.
// Write the layout with JSX + Tailwind (and lib/highlighter.ts if you need a
// real syntax-highlighted code block in it), register it below, then use the
// export bar to rasterize it.
export type PlaygroundDesign = {
  id: string
  label: string
  category: DesignCategory
  // Optional <optgroup> label — used to keep the slides of one Instagram
  // highlight together in the design select.
  group?: string
  width: number
  height: number
  Component: ComponentType
}
