import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react'

interface CommandPaletteContextType {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  registerAction: (id: string, callback: () => void) => void
  unregisterAction: (id: string) => void
  executeAction: (id: string) => boolean
  isActionAvailable: (id: string) => boolean
}

const CommandPaletteContext = createContext<CommandPaletteContextType | undefined>(undefined)

export const CommandPaletteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false)
  const actionsRef = useRef<Record<string, () => void>>({})

  const registerAction = useCallback((id: string, callback: () => void) => {
    actionsRef.current[id] = callback
  }, [])

  const unregisterAction = useCallback((id: string) => {
    delete actionsRef.current[id]
  }, [])

  const executeAction = useCallback((id: string) => {
    const callback = actionsRef.current[id]
    if (callback) {
      callback()
      return true
    }
    return false
  }, [])

  const isActionAvailable = useCallback((id: string) => {
    return !!actionsRef.current[id]
  }, [])

  // Register Global Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Toggle Command Palette: Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
        return
      }

      // 2. Close overlay if Escape is pressed
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault()
        setIsOpen(false)
        return
      }

      // 3. Global Action Shortcuts (only when palette is closed)
      if (!isOpen) {
        // Cmd/Ctrl + Enter -> Trigger generate or resume
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
          const activeEl = document.activeElement
          const isInputFocused = activeEl && activeEl.tagName === 'INPUT'

          if (!isInputFocused) {
            if (isActionAvailable('resume')) {
              e.preventDefault()
              executeAction('resume')
            } else if (isActionAvailable('generate')) {
              e.preventDefault()
              executeAction('generate')
            }
          }
        }

        // Cmd/Ctrl + Shift + N -> Start new document
        if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'N') {
          if (isActionAvailable('new-document')) {
            e.preventDefault()
            executeAction('new-document')
          }
        }

        // Cmd/Ctrl + S -> Download PDF document
        if ((e.metaKey || e.ctrlKey) && e.key === 's') {
          if (isActionAvailable('download-pdf')) {
            e.preventDefault()
            executeAction('download-pdf')
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, executeAction, isActionAvailable])

  return (
    <CommandPaletteContext.Provider
      value={{
        isOpen,
        setIsOpen,
        registerAction,
        unregisterAction,
        executeAction,
        isActionAvailable,
      }}
    >
      {children}
    </CommandPaletteContext.Provider>
  )
}

export function useCommandPalette() {
  const context = useContext(CommandPaletteContext)
  if (!context) {
    throw new Error('useCommandPalette must be used within a CommandPaletteProvider')
  }
  return context
}
