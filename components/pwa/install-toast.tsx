/**
 * PWA Install Toast Component
 *
 * Displays a toast notification from the top of the screen
 * prompting users to install the PWA. Uses Sonner toast library.
 *
 * Features:
 * - Auto-dismisses after 10 seconds
 * - Shows only when app is installable (not already installed)
 * - Persists user's dismissal preference in localStorage
 * - RTL support for Persian/Arabic languages
 *
 * @module components/pwa/install-toast
 */

'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { usePWAInstall } from '@/hooks/use-pwa-install';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Props for InstallToast component
 */
interface InstallToastProps {
  /** Translation dictionary for PWA-related strings */
  dict: {
    install_title: string;
    install_description: string;
    install_button: string;
  };
  /** Whether the current locale is RTL (Right-to-Left) */
  isRTL: boolean;
}

// Storage key for persisting dismissal state
const DISMISS_KEY = 'pwa-install-toast-dismissed';

/**
 * PWA Install Toast Component
 *
 * Shows a non-intrusive toast notification when the app is installable.
 * The toast appears from the top of the screen and can be dismissed.
 *
 * @example
 * <InstallToast
 *   dict={dict.pwa}
 *   isRTL={lang === 'fa'}
 * />
 */
export function InstallToast({ dict, isRTL }: InstallToastProps) {
  const { isInstallable, promptInstall } = usePWAInstall();
  const hasShownRef = useRef(false);

  useEffect(() => {
    // Only show once per session and if installable
    if (hasShownRef.current || !isInstallable) return;

    // Check if user has dismissed before
    const isDismissed = localStorage.getItem(DISMISS_KEY);
    if (isDismissed === 'true') return;

    // Mark as shown
    hasShownRef.current = true;

    // Small delay to ensure page is loaded
    const timeout = setTimeout(() => {
      toast.custom(
        (id) => (
          <div
            className={cn(
              'w-full max-w-sm bg-card border shadow-lg rounded-lg p-4',
              'flex items-center gap-3',
              isRTL && 'flex-row-reverse'
            )}
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            {/* Icon */}
            <div className="shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Download className="w-5 h-5 text-primary" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-card-foreground">
                {dict.install_title}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {dict.install_description}
              </p>
            </div>

            {/* Actions */}
            <div
              className={cn(
                'flex items-center gap-2',
                isRTL && 'flex-row-reverse'
              )}
            >
              <Button
                size="sm"
                onClick={() => {
                  promptInstall();
                  toast.dismiss(id);
                }}
              >
                {dict.install_button}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => {
                  localStorage.setItem(DISMISS_KEY, 'true');
                  toast.dismiss(id);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ),
        {
          id: 'pwa-install-toast',
          duration: 10000, // 10 seconds
          position: 'top-center',
        }
      );
    }, 2000); // Show after 2 seconds

    return () => clearTimeout(timeout);
  }, [isInstallable, promptInstall, dict, isRTL]);

  // This component doesn't render anything visible
  // It triggers a toast notification
  return null;
}
