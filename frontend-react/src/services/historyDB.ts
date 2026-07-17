/**
 * IndexedDB persistence layer for document history.
 *
 * Schema: agentdoc_history / documents
 * - id: auto-incremented primary key
 * - prompt: original user request
 * - summary: generated document summary
 * - document_filename: backend output filename
 * - format: pdf | docx | md
 * - mode: standard | advanced | adaptive
 * - created_at: ISO timestamp
 * - time_taken: pipeline duration in seconds
 * - active_model: LLM model used
 * - llm_call_count: number of LLM calls
 */

const DB_NAME = 'agentdoc_history'
const DB_VERSION = 2
const STORE_NAME = 'documents'

export interface HistoryEntry {
  id?: number
  title?: string // User editable title, defaults to prompt snippet
  prompt: string
  summary: string
  document_filename: string
  format: string
  mode: string
  created_at: string
  time_taken?: number
  active_model?: string
  llm_call_count?: number
  // Future-proofing fields for Phase 3 enhancements
  is_favorite?: boolean
  tags?: string[]
  categories?: string[]
  is_archived?: boolean
  metadata?: Record<string, any>
}

function notifyChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('agentdoc-history-change'))
  }
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = request.result
      let store: IDBObjectStore
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        })
      } else {
        store = request.transaction!.objectStore(STORE_NAME)
      }

      if (!store.indexNames.contains('created_at')) {
        store.createIndex('created_at', 'created_at', { unique: false })
      }
      if (!store.indexNames.contains('is_favorite')) {
        store.createIndex('is_favorite', 'is_favorite', { unique: false })
      }

      // Perform safe backward-compatible data migration
      if (event.oldVersion < 2) {
        const cursorRequest = store.openCursor()
        cursorRequest.onsuccess = (e: any) => {
          const cursor = e.target.result
          if (cursor) {
            const data = cursor.value
            let updated = false
            if (data.is_favorite === undefined) {
              data.is_favorite = false
              updated = true
            }
            if (data.is_archived === undefined) {
              data.is_archived = false
              updated = true
            }
            if (data.title === undefined) {
              const firstWords = data.prompt.split(' ').slice(0, 5).join(' ')
              data.title = firstWords.length > 50 ? firstWords.slice(0, 47) + '...' : firstWords
              updated = true
            }
            if (updated) {
              cursor.update(data)
            }
            cursor.continue()
          }
        }
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/**
 * Save a new document entry to the history store.
 */
export async function saveHistoryEntry(entry: Omit<HistoryEntry, 'id'>): Promise<number> {
  // Ensure default title exists based on prompt
  if (!entry.title) {
    const firstWords = entry.prompt.split(' ').slice(0, 5).join(' ')
    entry.title = firstWords.length > 50 ? firstWords.slice(0, 47) + '...' : firstWords
  }
  if (entry.is_favorite === undefined) {
    entry.is_favorite = false
  }
  if (entry.is_archived === undefined) {
    entry.is_archived = false
  }
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.add(entry)
    request.onsuccess = () => {
      const newId = request.result as number
      const getAllRequest = store.getAll()
      getAllRequest.onsuccess = () => {
        const allEntries = getAllRequest.result as HistoryEntry[]
        if (allEntries.length > 10) {
          // Sort oldest first (by date)
          allEntries.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          const toDeleteCount = allEntries.length - 10
          for (let i = 0; i < toDeleteCount; i++) {
            if (allEntries[i].id !== undefined) {
              store.delete(allEntries[i].id!)
            }
          }
        }
        notifyChange()
        resolve(newId)
      }
      getAllRequest.onerror = () => {
        notifyChange()
        resolve(newId)
      }
    }
    request.onerror = () => reject(request.error)
    tx.oncomplete = () => db.close()
  })
}

/**
 * Retrieve all history entries, sorted newest-first.
 */
export async function getAllHistoryEntries(): Promise<HistoryEntry[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.getAll()
    request.onsuccess = () => {
      const entries = (request.result as HistoryEntry[]).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      resolve(entries)
    }
    request.onerror = () => reject(request.error)
    tx.oncomplete = () => db.close()
  })
}

/**
 * Delete a single history entry by ID.
 */
export async function deleteHistoryEntry(id: number): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.delete(id)
    request.onsuccess = () => {
      notifyChange()
      resolve()
    }
    request.onerror = () => reject(request.error)
    tx.oncomplete = () => db.close()
  })
}

/**
 * Clear all history entries.
 */
export async function clearAllHistory(): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.clear()
    request.onsuccess = () => {
      notifyChange()
      resolve()
    }
    request.onerror = () => reject(request.error)
    tx.oncomplete = () => db.close()
  })
}

/**
 * Update a history entry with partial values (e.g. title rename, favorite toggle)
 */
export async function updateHistoryEntry(id: number, updates: Partial<HistoryEntry>): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const getReq = store.get(id)
    
    getReq.onsuccess = () => {
      const data = getReq.result
      if (!data) {
        reject(new Error(`History entry not found: ${id}`))
        return
      }
      const updated = { ...data, ...updates }
      const putReq = store.put(updated)
      putReq.onsuccess = () => {
        notifyChange()
        resolve()
      }
      putReq.onerror = () => reject(putReq.error)
    }
    getReq.onerror = () => reject(getReq.error)
    tx.oncomplete = () => db.close()
  })
}

/**
 * Duplicate a history entry with content, updates, metadata, format, and stats
 */
export async function duplicateHistoryEntry(id: number): Promise<number> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const getReq = store.get(id)
    
    getReq.onsuccess = () => {
      const data = getReq.result
      if (!data) {
        reject(new Error(`History entry not found: ${id}`))
        return
      }
      const { id: _, ...rest } = data
      const duplicated = {
        ...rest,
        title: rest.title ? `Copy of ${rest.title}` : `Copy of ${rest.prompt.slice(0, 30)}...`,
        created_at: new Date().toISOString()
      }
      const addReq = store.add(duplicated)
      addReq.onsuccess = () => {
        const newId = addReq.result as number
        const getAllRequest = store.getAll()
        getAllRequest.onsuccess = () => {
          const allEntries = getAllRequest.result as HistoryEntry[]
          if (allEntries.length > 10) {
            allEntries.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            const toDeleteCount = allEntries.length - 10
            for (let i = 0; i < toDeleteCount; i++) {
              if (allEntries[i].id !== undefined) {
                store.delete(allEntries[i].id!)
              }
            }
          }
          notifyChange()
          resolve(newId)
        }
        getAllRequest.onerror = () => {
          notifyChange()
          resolve(newId)
        }
      }
      addReq.onerror = () => reject(addReq.error)
    }
    getReq.onerror = () => reject(getReq.error)
    tx.oncomplete = () => db.close()
  })
}
