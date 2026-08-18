import "@workspace/ui/globals.css";
import "../fonts.css";

import type { Metadata, Viewport } from "next";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ToastProvider } from "@workspace/ui/components/toast";
import { cn } from "@workspace/ui/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { PwaRegister } from "@/components/pwa-register";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
import { DictionaryProvider } from "@/i18n/dictionary-provider";
import { getDictionary } from "@/i18n/get-dictionary";
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  dirOf,
  hasLocale,
  type Locale,
} from "@/i18n/config";
import { fontMono, fontSans, fontVazir } from "@/lib/fonts";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((lang) => ({ lang }));
}

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale: Locale = hasLocale(lang) ? lang : DEFAULT_LOCALE;
  const isFa = locale === "fa";

  const title = isFa
    ? "تهگو | نقشه و مسیریاب مترو تهران"
    : "TehGo | Tehran Metro Map & Route Planner";
  const description = isFa
    ? "نقشه تعاملی و مسیریاب مترو تهران و کرج"
    : "Interactive map and route planner for Tehran and Karaj metro";

  return {
    title,
    description,
    alternates: {
      languages: { fa: "/fa", en: "/en" },
    },
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "TehGo",
    },
    openGraph: {
      title,
      description,
      locale: isFa ? "fa_IR" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = hasLocale(lang) ? lang : DEFAULT_LOCALE;
  if (!hasLocale(lang)) notFound();

  const dict = await getDictionary(locale);
  const dir = dirOf(locale);

  return (
    <html
      lang={locale}
      dir={dir}
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        fontSans.variable,
        fontVazir.variable
      )}
    >
      <body className="overflow-hidden overscroll-none">
        <PwaRegister />
        <NuqsAdapter>
          <ThemeProvider>
            <DictionaryProvider dict={dict} locale={locale}>
              <ToastProvider position="top-center">
                {children}
                <PwaInstallPrompt />
              </ToastProvider>
            </DictionaryProvider>
          </ThemeProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
