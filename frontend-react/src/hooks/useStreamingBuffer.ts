import { useState, useRef, useEffect, useCallback } from 'react'

export function useStreamingBuffer() {
  const [displayText, setDisplayText] = useState('')
  const textRef = useRef('')
  const bufferRef = useRef<string[]>([])
  const rafIdRef = useRef<number | null>(null)

  const flushBuffer = useCallback(() => {
    if (bufferRef.current.length === 0) {
      rafIdRef.current = null
      return
    }

    // Append all buffered tokens to our main text ref
    textRef.current += bufferRef.current.join('')
    bufferRef.current = []
    
    // Update React state once per frame
    setDisplayText(textRef.current)
    
    // Reset RAF handle
    rafIdRef.current = null
  }, [])

  const appendToken = useCallback((token: string) => {
    bufferRef.current.push(token)
    
    // Schedule flush on next animation frame if not already scheduled
    if (rafIdRef.current === null) {
      rafIdRef.current = requestAnimationFrame(flushBuffer)
    }
  }, [flushBuffer])

  const resetText = useCallback(() => {
    // Cancel any pending animation frame
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
    bufferRef.current = []
    textRef.current = ''
    setDisplayText('')
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [])

  return {
    displayText,
    appendToken,
    resetText,
  }
}
