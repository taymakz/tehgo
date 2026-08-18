import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TehGo — Tehran Metro Map & Route Planner",
    short_name: "TehGo",
    description: "Interactive map and route planner for Tehran and Karaj metro",
    start_url: "/fa",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    lang: "fa",
    dir: "rtl",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    icons: [
      {
        src: "/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/maskable-icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
