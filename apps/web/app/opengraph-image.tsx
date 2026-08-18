import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { lines } from "@workspace/metro-core/data";

export const alt = "TehGo - Tehran & Karaj Metro Map and Route Planner";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const lineColors = Object.values(lines)
  .sort((a, b) => a.id.localeCompare(b.id))
  .map((line) => line.color);

const routePaths = [
  "M -50 120 C 250 120, 300 250, 550 250 S 850 400, 1250 380",
  "M -50 480 C 200 480, 280 320, 520 320 S 780 150, 1250 170",
  "M -50 300 C 300 300, 350 60, 650 60 S 950 500, 1250 520",
  "M -50 560 C 250 560, 400 420, 700 420 S 1000 240, 1250 260",
];

export default async function Image() {
  const fontsDir = path.join(process.cwd(), "assets/fonts/og");
  const [regular, semibold, bold] = await Promise.all([
    readFile(path.join(fontsDir, "geist-regular.ttf")),
    readFile(path.join(fontsDir, "geist-semibold.ttf")),
    readFile(path.join(fontsDir, "geist-bold.ttf")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          height: "100%",
          width: "100%",
          backgroundColor: "#141414",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Geist",
        }}
      >
        <svg
          style={{ position: "absolute", inset: 0 }}
          width="1200"
          height="630"
          viewBox="0 0 1200 630"
          fill="none"
        >
          {routePaths.map((d, i) => (
            <path
              key={i}
              d={d}
              stroke={lineColors[i % lineColors.length]}
              strokeWidth="6"
              strokeLinecap="round"
              opacity="0.22"
            />
          ))}
        </svg>

        <svg width="120" height="120" viewBox="0 0 24 24" fill="none" style={{ marginBottom: "40px" }}>
          <path
            d="M3.16496 19.5025L10.5275 2.99281C11.1178 1.66906 12.8822 1.66906 13.4725 2.99281L20.835 19.5025C21.5021 20.9984 20.0209 22.5499 18.6331 21.809L12.7294 18.657C12.2702 18.4118 11.7298 18.4118 11.2706 18.657L5.36689 21.809C3.97914 22.5499 2.49789 20.9984 3.16496 19.5025Z"
            fill="white"
          />
        </svg>

        <h1
          style={{
            margin: 0,
            marginBottom: "18px",
            display: "flex",
            fontSize: "104px",
            fontWeight: 700,
            letterSpacing: "-2px",
            color: "white",
          }}
        >
          TehGo
        </h1>

        <p
          style={{
            margin: 0,
            marginBottom: "44px",
            display: "flex",
            fontSize: "32px",
            fontWeight: 500,
            color: "#A1A1AA",
          }}
        >
          Tehran &amp; Karaj Metro Map and Route Planner
        </p>

        <div style={{ display: "flex", gap: "12px" }}>
          {lineColors.map((color, i) => (
            <div
              key={i}
              style={{
                width: "22px",
                height: "22px",
                borderRadius: "9999px",
                backgroundColor: color,
              }}
            />
          ))}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Geist", data: regular, style: "normal", weight: 500 },
        { name: "Geist", data: semibold, style: "normal", weight: 600 },
        { name: "Geist", data: bold, style: "normal", weight: 700 },
      ],
    }
  );
}
