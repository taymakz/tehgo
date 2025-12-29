/**
 * Application Providers Component
 *
 * This component wraps the entire application with necessary context providers:
 * - ThemeProvider: Manages dark/light/system theme preferences
 * - TanstackQueryProvider: Handles server state and data fetching
 * - DirectionProvider: Manages RTL/LTR text direction for i18n
 * - Toaster: Provides toast notification capabilities
 *
 * The providers are organized in a specific order for proper functionality:
 * 1. Theme (outermost - affects all styling)
 * 2. Query (handles data layer)
 * 3. Direction (affects all child components)
 *
 * @see https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns
 */

"use client";

import { ThemeProvider } from "next-themes";
import { TanstackQueryProvider } from "./tanstack-query";
import { Toaster } from "@/components/ui/sonner";
import { DirectionProvider } from "@radix-ui/react-direction";

/**
 * Props interface for the Providers component
 */
interface ProvidersProps {
  /** Child components to wrap with providers */
  children: React.ReactNode;
  /** Current locale code (e.g., 'fa', 'en') */
  lang: string;
}

/**
 * Root Providers Component
 *
 * Wraps the application with all necessary context providers.
 * This is a client component because providers use React context.
 *
 * @param children - Child components to render
 * @param lang - Current locale for direction detection
 */
export default function Providers({ children, lang }: ProvidersProps) {
  // Determine text direction based on locale
  // Persian (fa) uses RTL, English (en) uses LTR
  const dir = lang === 'fa' ? 'rtl' : 'ltr';

  return (
    <>
      {/*
        ThemeProvider from next-themes
        - attribute="class": Uses class-based theme switching
        - disableTransitionOnChange: Prevents flash during theme switch
        - enableSystem: Respects system preference by default
      */}
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {/*
          TanstackQueryProvider (React Query)
          - Handles server state management
          - Provides caching and background refetching
          - See tanstack-query.tsx for configuration
        */}
        <TanstackQueryProvider>
          {/*
            DirectionProvider from Radix UI
            - Provides RTL/LTR context to all Radix components
            - Ensures proper styling for bidirectional text
          */}
          <DirectionProvider dir={dir}>
            {/*
              Sonner Toaster for toast notifications
              - Position and styling configured in component
              - RTL-aware through DirectionProvider
            */}
      
            {children}
          </DirectionProvider>
        </TanstackQueryProvider>
      </ThemeProvider>
    </>
  );
}

