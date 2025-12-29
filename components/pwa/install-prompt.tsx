/**
 * PWA Install Prompt Component
 *
 * This client component handles:
 * - Detecting if the app can be installed
 * - Showing installation instructions for iOS devices
 * - Triggering native install prompts on supported browsers
 * - Hiding when already installed
 *
 * PWA installation allows users to add the app to their home screen
 * for a native app-like experience.
 *
 * @see https://web.dev/learn/pwa/installation-prompt
 */

'use client'

import { useState, useEffect } from 'react'

/**
 * Props interface for InstallPrompt
 */
interface InstallPromptProps {
  /** Localized strings for the component */
  dict: {
    install: string
    add_home_screen: string
    ios_instruction: string
  }
  /** Whether the current locale is RTL */
  isRTL: boolean
}

/**
 * BeforeInstallPromptEvent interface
 *
 * This event is fired when the browser detects that the app
 * can be installed. Not all browsers support this event.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * Install Prompt Component
 *
 * Provides platform-specific installation prompts:
 * - iOS: Shows manual installation instructions
 * - Android/Desktop: Uses native install prompt (when available)
 */
export function InstallPrompt({ dict, isRTL }: InstallPromptProps) {
  // Track if current device is iOS
  const [isIOS, setIsIOS] = useState(false)

  // Track if app is already installed (running in standalone mode)
  const [isStandalone, setIsStandalone] = useState(false)

  // Store the deferred install prompt event
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  // Track if install button should be shown (for non-iOS devices)
  const [showInstallButton, setShowInstallButton] = useState(false)

  /**
   * Detect platform and installation state
   */
  useEffect(() => {
    // Check if running on iOS
    // Note: iPadOS 13+ reports as Mac, so we also check for touch support
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as unknown as { MSStream?: unknown }).MSStream
    setIsIOS(isIOSDevice)

    // Check if app is already installed (running in standalone mode)
    // This includes:
    // - display-mode: standalone (most browsers)
    // - navigator.standalone (iOS Safari)
    const isRunningStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true

    setIsStandalone(isRunningStandalone)

    // Listen for the beforeinstallprompt event
    // This event is fired when the browser detects the app can be installed
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()

      // Store the event for later use
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallButton(true)

      console.log('Install prompt available')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      console.log('App was installed')
      setDeferredPrompt(null)
      setShowInstallButton(false)
      setIsStandalone(true)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  /**
   * Handles the install button click
   * Triggers the native install prompt on supported browsers
   */
  async function handleInstallClick() {
    if (!deferredPrompt) return

    // Show the install prompt
    await deferredPrompt.prompt()

    // Wait for user response
    const { outcome } = await deferredPrompt.userChoice

    console.log(`Install prompt outcome: ${outcome}`)

    // Clear the deferred prompt (can only be used once)
    setDeferredPrompt(null)
    setShowInstallButton(false)
  }

  // Don't show anything if already installed
  if (isStandalone) {
    return null
  }

  return (
    <div className="rounded-lg border bg-card p-4 text-card-foreground">
      <h3 className="mb-4 text-lg font-semibold">
        {dict.install}
      </h3>

      {/* iOS-specific instructions */}
      {isIOS && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {dict.ios_instruction}
          </p>

          {/* Visual guide for iOS installation */}
          <div className="flex items-center justify-center gap-4 rounded-lg bg-muted p-4">
            {/* Share icon */}
            <div className="flex flex-col items-center">
              <span
                role="img"
                aria-label="share icon"
                className="text-2xl"
              >
                ⎋
              </span>
              <span className="mt-1 text-xs text-muted-foreground">
                {isRTL ? 'اشتراک' : 'Share'}
              </span>
            </div>

            {/* Arrow */}
            <span className="text-muted-foreground">→</span>

            {/* Add to home screen icon */}
            <div className="flex flex-col items-center">
              <span
                role="img"
                aria-label="plus icon"
                className="text-2xl"
              >
                ➕
              </span>
              <span className="mt-1 text-xs text-muted-foreground">
                {isRTL ? 'صفحه اصلی' : 'Home Screen'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Install button for browsers that support beforeinstallprompt */}
      {showInstallButton && !isIOS && (
        <button
          onClick={handleInstallClick}
          className="w-full rounded-lg bg-primary px-4 py-3 text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <span className="flex items-center justify-center gap-2">
            {/* Download icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" x2="12" y1="15" y2="3" />
            </svg>
            {dict.add_home_screen}
          </span>
        </button>
      )}

      {/* Fallback message when install is not available */}
      {!showInstallButton && !isIOS && (
        <p className="text-sm text-muted-foreground">
          {isRTL
            ? 'این اپلیکیشن را می‌توانید از منوی مرورگر به صفحه اصلی اضافه کنید.'
            : 'You can add this app to your home screen from your browser menu.'}
        </p>
      )}
    </div>
  )
}
