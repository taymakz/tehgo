import {
  Geist_Mono as FontMono,
  Geist as FontSans,
  Inter,
} from "next/font/google";
import localFont from "next/font/local";
import { cn } from "@/lib/utils";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

const fontMono = FontMono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600", "700"],

});

const fontInter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
});

const fontVazir = localFont({
  src: [
    {
      path: "../public/fonts/vazir/Vazirmatn[wght].woff2",
      style: "normal",
      weight: "100 900",
    },
  ],
  variable: "--font-vazir",
  display: "swap",
});

export const fontVariables = cn(
  fontVazir.variable,
  fontSans.variable,
  fontMono.variable,
  fontInter.variable,
);
