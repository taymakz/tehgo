/**
 * Online Status Hook
 *
 * This hook tracks the browser's online/offline status and provides
 * real-time updates when connectivity changes.
 *
 * Essential for PWA offline functionality to show appropriate UI
 * states when the user loses connectivity.
 *
 * @example
 * ```tsx
 * const { isOnline, wasOffline } = useOnlineStatus()
 *
 * if (!isOnline) {
 *   return <OfflineBanner />
 * }
 * ```
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Return type for useOnlineStatus hook
 */
interface UseOnlineStatusReturn {
  /** Current online status */
  isOnline: boolean;
  /** Whether the user was offline during this session */
  wasOffline: boolean;
  /** Last time the status changed */
  lastChanged: Date | null;
  /** Function to manually check connectivity */
  checkConnectivity: () => Promise<boolean>;
}

/**
 * Hook for tracking online/offline status
 *
 * @returns Object with connectivity state and methods
 */
export function useOnlineStatus(): UseOnlineStatusReturn {
  // Track online status (default to true for SSR)
  const [isOnline, setIsOnline] = useState(true);

  // Track if user was ever offline in this session
  const [wasOffline, setWasOffline] = useState(false);

  // Track when status last changed
  const [lastChanged, setLastChanged] = useState<Date | null>(null);

  useEffect(() => {
    // Set initial state based on navigator.onLine
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
    }

    // Handler for going online
    const handleOnline = () => {
      setIsOnline(true);
      setLastChanged(new Date());
    };

    // Handler for going offline
    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      setLastChanged(new Date());
    };

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /**
   * Manually check connectivity by making a network request
   *
   * navigator.onLine can be unreliable (it only checks if there's
   * a network interface, not actual internet connectivity)
   */
  const checkConnectivity = useCallback(async (): Promise<boolean> => {
    try {
      // Try to fetch a small resource
      const response = await fetch('/manifest.webmanifest', {
        method: 'HEAD',
        cache: 'no-store',
      });

      const online = response.ok;
      setIsOnline(online);

      if (!online) {
        setWasOffline(true);
      }

      return online;
    } catch {
      setIsOnline(false);
      setWasOffline(true);
      return false;
    }
  }, []);

  return {
    isOnline,
    wasOffline,
    lastChanged,
    checkConnectivity,
  };
}
