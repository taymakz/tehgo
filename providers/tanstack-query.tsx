/**
 * TanStack Query (React Query) Provider
 *
 * This provider sets up React Query for the application, enabling:
 * - Automatic caching of server data
 * - Background refetching
 * - Optimistic updates
 * - Offline support with cached data
 *
 * React Query is essential for PWA offline functionality as it
 * automatically serves cached data when the network is unavailable.
 *
 * @see https://tanstack.com/query/latest
 */

"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * Creates a configured QueryClient instance
 *
 * This function creates a new QueryClient with optimized settings
 * for PWA offline support and performance.
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        /**
         * Stale time configuration
         * Data is considered fresh for 1 minute
         * During this time, cached data is returned without refetching
         */
        staleTime: 60 * 1000, // 1 minute

        /**
         * Garbage collection time
         * Unused data is kept in cache for 5 minutes
         * Important for offline access to previously viewed data
         */
        gcTime: 5 * 60 * 1000, // 5 minutes

        /**
         * Retry configuration
         * Retry failed requests up to 3 times with exponential backoff
         * Useful for handling temporary network issues
         */
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

        /**
         * Refetch behavior
         * - refetchOnWindowFocus: Refetch when user returns to tab
         * - refetchOnReconnect: Refetch when network reconnects (PWA important)
         * - refetchOnMount: Only refetch if data is stale
         */
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        refetchOnMount: 'always',

        /**
         * Network mode
         * 'offlineFirst': Return cached data immediately, then refetch
         * Essential for PWA offline-first experience
         */
        networkMode: 'offlineFirst',
      },
      mutations: {
        /**
         * Mutation retry configuration
         * Mutations retry once to handle network hiccups
         */
        retry: 1,

        /**
         * Network mode for mutations
         * 'online': Only execute when online
         * Prevents failed mutations when offline
         */
        networkMode: 'online',
      },
    },
  });
}

// Browser-side QueryClient singleton
// We use a module-level variable to persist across re-renders
let browserQueryClient: QueryClient | undefined = undefined;

/**
 * Gets or creates a QueryClient instance
 *
 * On the server, creates a new instance for each request
 * On the client, reuses the same instance across the app
 */
function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always create a new QueryClient
    return makeQueryClient();
  } else {
    // Browser: create once and reuse
    if (!browserQueryClient) {
      browserQueryClient = makeQueryClient();
    }
    return browserQueryClient;
  }
}

/**
 * Props interface for TanstackQueryProvider
 */
interface TanstackQueryProviderProps {
  children: React.ReactNode;
}

/**
 * TanStack Query Provider Component
 *
 * Wraps the application with QueryClientProvider to enable
 * React Query throughout the component tree.
 *
 * @param children - Child components to wrap
 */
export function TanstackQueryProvider({ children }: TanstackQueryProviderProps) {
  // Get or create the QueryClient
  // Using useState ensures the client is only created once on the client
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

