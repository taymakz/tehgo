import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// Local-only tool — no env, no docker, no build target beyond a static
// `dist/` you open straight from disk or `vite preview`.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // ui/'s own files self-reference via "@workspace/ui/*" (e.g.
      // elastic-slider.tsx importing its sibling hook); Vite/Rollup don't
      // implement Node's package self-referencing resolution, so a plain
      // node_modules symlink to @workspace/ui isn't enough — alias it
      // directly, same target as the tsconfig "paths" entry. ui/ is a plain
      // sibling source folder here (not an installed workspace package), so
      // this bypasses ui/package.json's "exports" map entirely.
      "@workspace/ui": path.resolve(__dirname, "./ui/src"),
    },
  },
})
