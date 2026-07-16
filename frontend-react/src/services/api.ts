import type { GenerationRequestParams, PlanReviewData, SSEEvent } from '../types/api'

const API_BASE = '' // Relative path — dev proxy handles localhost, production serves from root

export class ApiError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}

/**
 * Health check endpoint.
 */
export async function checkHealth(): Promise<{ status: string; service: string }> {
  try {
    const res = await fetch(`${API_BASE}/health`)
    if (!res.ok) {
      throw new ApiError(`Health check failed: ${res.statusText}`, res.status)
    }
    return await res.json()
  } catch (err) {
    throw new ApiError(err instanceof Error ? err.message : 'Failed to connect to backend server.')
  }
}

/**
 * Interface representing callbacks for active stream processes.
 */
export interface StreamCallbacks {
  onProgress: (stage: string) => void
  onToken: (content: string) => void
  onReview: (data: PlanReviewData) => void
  onResult: (data: any) => void
  onError: (error: string) => void
}

/**
 * Initiates the initial generation process via GET SSE stream.
 * @param params Request params (prompt, format, mode, cache toggle, review toggle)
 * @param callbacks Event handling callbacks
 * @returns EventSource instance (use .close() to cancel/disconnect)
 */
export function streamGeneration(
  params: GenerationRequestParams,
  callbacks: StreamCallbacks
): EventSource {
  const queryParams = new URLSearchParams({
    request: params.request,
    require_review: String(params.requireReview),
    format: params.format,
    mode: params.mode,
    ignore_cache: String(params.ignoreCache),
  })

  const eventSource = new EventSource(`${API_BASE}/agent/stream?${queryParams}`)

  eventSource.onmessage = (event) => {
    try {
      const data: SSEEvent = JSON.parse(event.data)
      switch (data.type) {
        case 'progress':
          callbacks.onProgress(data.stage)
          break
        case 'token':
          callbacks.onToken(data.content)
          break
        case 'review':
          callbacks.onReview(data.data)
          break
        case 'result':
          callbacks.onResult(data.data)
          break
        case 'error':
          callbacks.onError(data.error)
          break
      }
    } catch (err) {
      console.error('Failed to parse SSE event payload:', err)
    }
  }

  eventSource.onerror = () => {
    eventSource.close()
    callbacks.onError('Connection to the document generator stream was lost.')
  }

  return eventSource
}

/**
 * Resumes generation process by sending the reviewed plan back via POST stream.
 * @param reviewData Edited plan data to execute
 * @param callbacks Event handling callbacks
 * @param signal AbortSignal to handle cancellation
 */
export async function streamPlanExecution(
  reviewData: PlanReviewData,
  callbacks: StreamCallbacks,
  signal: AbortSignal
): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/agent/execute/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reviewData),
      signal,
    })

    if (!res.ok) {
      throw new ApiError(`Execution stream failed: ${res.statusText}`, res.status)
    }

    const reader = res.body?.getReader()
    if (!reader) {
      throw new ApiError('Response body is not readable.')
    }

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.trim() || !line.startsWith('data: ')) continue
        try {
          const rawData = line.slice(6).trim()
          const data: SSEEvent = JSON.parse(rawData)
          
          switch (data.type) {
            case 'progress':
              callbacks.onProgress(data.stage)
              break
            case 'token':
              callbacks.onToken(data.content)
              break
            case 'result':
              callbacks.onResult(data.data)
              break
            case 'error':
              callbacks.onError(data.error)
              break
          }
        } catch (e) {
          // Skip parser errors for incomplete logs
        }
      }
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.log('Stream execution aborted by user.')
    } else {
      callbacks.onError(err.message || 'Connection lost during plan execution.')
    }
  }
}

/**
 * Returns absolute download link for a given output document.
 */
export function getDocumentDownloadUrl(filename: string): string {
  return `${API_BASE}/documents/${encodeURIComponent(filename)}`
}
