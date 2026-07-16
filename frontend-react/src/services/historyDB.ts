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
const DB_VERSION = 1
const STORE_NAME = 'documents'

export interface HistoryEntry {
  id?: number
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
  metadata?: Record<string, any>
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        })
        store.createIndex('created_at', 'created_at', { unique: false })
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
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.add(entry)
    request.onsuccess = () => resolve(request.result as number)
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
    request.onsuccess = () => resolve()
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
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
    tx.oncomplete = () => db.close()
  })
}
