import { useState, useEffect, useCallback } from 'react'
import type { DocumentFormat, ExecutionMode } from '@/types/api'

export interface UserSettings {
  format: DocumentFormat
  mode: ExecutionMode
  requireReview: boolean
  ignoreCache: boolean
}

const STORAGE_KEY = 'agentdoc_user_settings'

const DEFAULT_SETTINGS: UserSettings = {
  format: 'pdf',
  mode: 'standard',
  requireReview: false,
  ignoreCache: false,
}

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load settings on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setSettings(JSON.parse(stored))
      }
    } catch (err) {
      console.error('Failed to parse user settings from localStorage:', err)
    } finally {
      setIsLoaded(false) // Ready
    }
  }, [])

  const saveSettings = useCallback(async (newSettings: UserSettings): Promise<void> => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings))
      setSettings(newSettings)
    } catch (err) {
      console.error('Failed to write user settings to localStorage:', err)
      throw new Error('Storage write failed')
    }
  }, [])

  const resetToDefaults = useCallback(async (): Promise<void> => {
    try {
      localStorage.removeItem(STORAGE_KEY)
      setSettings(DEFAULT_SETTINGS)
    } catch (err) {
      console.error('Failed to reset default user settings:', err)
    }
  }, [])

  return {
    settings,
    saveSettings,
    resetToDefaults,
    isLoaded,
  }
}
