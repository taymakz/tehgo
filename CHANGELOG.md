# Changelog

## 2026-08-18 — Monorepo rebuild

TehGo moved to a Turborepo monorepo and both the web app and Android app now live
side by side in the same repository, sharing common assets and metro data.

### Web app — fully redesigned

- Rebuilt from the ground up as a full-map experience: the map fills the
  screen, with a floating From/To picker and route controls instead of a
  traditional page layout.
- Bilingual, RTL-first UI (Persian default, English), including correctly
  shaped Persian text in generated route images and the site's Open Graph
  image.
- Auto-computed routes with a fastest / fewest-transfers switch, live
  turn-by-turn boarding and transfer guidance on the map.
- Nested, animated drawers (station search, recent routes, share, export,
  settings) built on a single shared drawer system.
- Shareable route links (`?from=&to=`) with copy-link and native share.
- Installable PWA: offline support, background auto-update, and an install
  prompt that points Android users to the native app instead.
- Settings drawer with theme, language (switches instantly, no page reload),
  install options, metro map download, and links to the project and its
  creator.

### Android app — included in this repo

- The native Android app (Kotlin, Jetpack Compose, MapLibre) now lives at
  `apps/android`, carried over unchanged, and is documented in
  [apps/android/CLAUDE.md](./apps/android/CLAUDE.md).
- Same bilingual DFS route-finding engine and station/line data as the web
  app, kept in sync across both platforms.
- Android App Links scaffolding added so `tehgo.ir` links open the app
  directly once installed (pending a release-signed keystore and its
  Digital Asset Links fingerprint).

### Shared

- `packages/metro-core` holds the pure routing logic and static metro data
  used by the web app.
- `packages/ui` holds the shared, shadcn-style component library.
