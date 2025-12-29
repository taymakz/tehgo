/**
 * PWA Installation Hook
 *
 * This hook provides functionality for detecting and triggering
 * PWA installation prompts across different platforms.
 *
 * Features:
 * - Detects if app is already installed
 * - Detects iOS devices (requires manual installation)
 * - Stores and triggers beforeinstallprompt event
 * - Tracks installation outcome
 *
 * @example
 * ```tsx
 * const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall()
 *
 * if (isInstallable) {
 *   return <button onClick={promptInstall}>Install App</button>
 * }
 * ```
 */

'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * BeforeInstallPromptEvent interface
 * Extends the standard Event with PWA-specific properties
 */
interface BeforeInstallPromptEvent extends Event {
  /** Shows the installation prompt to the user */
  prompt: () => Promise<void>
  /** User's choice after seeing the prompt */
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * Return type for usePWAInstall hook
 */
interface UsePWAInstallReturn {
  /** Whether the app can be installed (beforeinstallprompt available) */
  isInstallable: boolean
  /** Whether the app is already installed (running standalone) */
  isInstalled: boolean
  /** Whether the device is iOS (requires manual installation) */
  isIOS: boolean
  /** Whether the device is Android */
  isAndroid: boolean
  /** Function to trigger the installation prompt */
  promptInstall: () => Promise<'accepted' | 'dismissed' | null>
  /** The outcome of the last installation attempt */
  installOutcome: 'accepted' | 'dismissed' | null
}

/**
 * Hook for PWA installation functionality
 *
 * @returns Object with installation state and methods
 */
export function usePWAInstall(): UsePWAInstallReturn {
  // Store the deferred prompt event
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  // Track installation state
  const [isInstalled, setIsInstalled] = useState(false)
  const [installOutcome, setInstallOutcome] = useState<'accepted' | 'dismissed' | null>(null)

  // Track platform
  const [isIOS, setIsIOS] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)

  useEffect(() => {
    // Detect platform
    const userAgent = window.navigator.userAgent.toLowerCase()

    // iOS detection (including iPadOS)
    const iosDevice = /iphone|ipad|ipod/.test(userAgent) &&
      !(window as unknown as { MSStream?: unknown }).MSStream
    setIsIOS(iosDevice)

    // Android detection
    const androidDevice = /android/.test(userAgent)
    setIsAndroid(androidDevice)

    // Check if already installed
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    setIsInstalled(standalone)

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    // Listen for successful installation
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
      setInstallOutcome('accepted')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  /**
   * Triggers the installation prompt
   *
   * @returns The outcome of the installation prompt
   */
  const promptInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | null> => {
    if (!deferredPrompt) {
      return null
    }

    // Show the prompt
    await deferredPrompt.prompt()

    // Wait for user response
    const { outcome } = await deferredPrompt.userChoice
    setInstallOutcome(outcome)

    // Clear the deferred prompt (can only be used once)
    setDeferredPrompt(null)

    return outcome
  }, [deferredPrompt])

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    isAndroid,
    promptInstall,
    installOutcome,
  }
}
