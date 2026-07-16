import { useState, useEffect, useCallback } from 'react'
import type { HistoryEntry } from '@/services/historyDB'
import {
  getAllHistoryEntries,
  saveHistoryEntry,
  deleteHistoryEntry,
  clearAllHistory,
} from '@/services/historyDB'

/**
 * React hook for managing document history state backed by IndexedDB.
 * Provides loading, saving, deleting, and clearing operations.
 */
export function useHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const data = await getAllHistoryEntries()
      setEntries(data)
    } catch (err) {
      console.error('Failed to load history:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load entries on mount
  useEffect(() => {
    refresh()
  }, [refresh])

  const addEntry = useCallback(
    async (entry: Omit<HistoryEntry, 'id'>) => {
      try {
        await saveHistoryEntry(entry)
        await refresh()
      } catch (err) {
        console.error('Failed to save history entry:', err)
      }
    },
    [refresh]
  )

  const removeEntry = useCallback(
    async (id: number) => {
      try {
        await deleteHistoryEntry(id)
        setEntries((prev) => prev.filter((e) => e.id !== id))
      } catch (err) {
        console.error('Failed to delete history entry:', err)
      }
    },
    []
  )

  const clearAll = useCallback(async () => {
    try {
      await clearAllHistory()
      setEntries([])
    } catch (err) {
      console.error('Failed to clear history:', err)
    }
  }, [])

  return {
    entries,
    isLoading,
    addEntry,
    removeEntry,
    clearAll,
    refresh,
  }
}
