import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCommandPalette } from './CommandPaletteContext'
import { Button } from '@/components/ui/button'
import {
  Sparkles,
  FileText,
  Settings,
  Download,
  Trash,
  ArrowRight,
  HelpCircle,
  Pencil,
  Search,
} from 'lucide-react'

interface CommandItem {
  id: string
  title: string
  subtitle: string
  category: 'navigation' | 'actions' | 'document' | 'system'
  shortcut?: string
  keywords?: string[]
  icon: React.ComponentType<{ className?: string }>
}

const ALL_COMMANDS: CommandItem[] = [
  // Navigation
  {
    id: 'nav-generate',
    title: 'Go to Generate Document',
    subtitle: 'Navigate to document creation workspace',
    category: 'navigation',
    shortcut: 'G',
    keywords: ['create', 'new', 'draft', 'workspace'],
    icon: Sparkles,
  },
  {
    id: 'nav-history',
    title: 'Go to Document Library',
    subtitle: 'Review previously generated drafts',
    category: 'navigation',
    shortcut: 'H',
    keywords: ['library', 'archive', 'saves', 'history'],
    icon: FileText,
  },
  {
    id: 'nav-settings',
    title: 'Go to Settings',
    subtitle: 'Configure preferences and system options',
    category: 'navigation',
    shortcut: 'S',
    keywords: ['preferences', 'api', 'model', 'cache'],
    icon: Settings,
  },
  
  // Creation/Actions
  {
    id: 'generate',
    title: 'Run Agent Pipeline',
    subtitle: 'Start compiling the document request',
    category: 'actions',
    shortcut: '⌘Enter',
    keywords: ['generate', 'submit', 'start', 'run'],
    icon: Sparkles,
  },
  {
    id: 'resume',
    title: 'Resume Execution',
    subtitle: 'Approve edited plan and start synthesis',
    category: 'actions',
    shortcut: '⌘Enter',
    keywords: ['resume', 'approve', 'continue', 'synthesize'],
    icon: ArrowRight,
  },
  {
    id: 'new-document',
    title: 'New Document (Reset Workspace)',
    subtitle: 'Clear current workspace parameters',
    category: 'actions',
    shortcut: '⌘⇧N',
    keywords: ['reset', 'clear', 'new', 'start over'],
    icon: Trash,
  },
  {
    id: 'focus-prompt',
    title: 'Focus Prompt Input',
    subtitle: 'Focus typing cursor into prompt textbox',
    category: 'actions',
    keywords: ['input', 'text', 'type', 'write'],
    icon: Pencil,
  },

  // Document downloads
  {
    id: 'download-pdf',
    title: 'Download PDF Document',
    subtitle: 'Export active output as a formatted PDF',
    category: 'document',
    shortcut: '⌘S',
    keywords: ['export', 'pdf', 'save', 'download'],
    icon: Download,
  },
  {
    id: 'download-md',
    title: 'Download Markdown (.md)',
    subtitle: 'Export active output as plain markdown text',
    category: 'document',
    keywords: ['export', 'markdown', 'md', 'raw'],
    icon: Download,
  },
  
  // Help shortcuts info
  {
    id: 'shortcuts-cheat',
    title: 'Keyboard Shortcuts Cheat Sheet',
    subtitle: 'Show list of global workspace shortcuts',
    category: 'system',
    keywords: ['help', 'keys', 'hotkeys', 'cheat'],
    icon: HelpCircle,
  }
]

export const CommandPalette: React.FC = () => {
  const { isOpen, setIsOpen, executeAction, isActionAvailable } = useCommandPalette()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [showCheatSheet, setShowCheatSheet] = useState(false)
  
  const navigate = useNavigate()
  const overlayRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // 1. Focus Management: Open/Close hooks
  useEffect(() => {
    if (isOpen) {
      // Store current focus
      previousFocusRef.current = document.activeElement as HTMLElement
      // Focus input
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
      setActiveIndex(0)
      setSearchQuery('')
      setShowCheatSheet(false)
      
      // Prevent body scrolling
      document.body.style.overflow = 'hidden'
    } else {
      // Restore previous focus
      document.body.style.overflow = ''
      if (previousFocusRef.current) {
        previousFocusRef.current.focus()
      }
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // 2. Context-Aware filtering: determine which commands are active/available
  const availableCommands = useMemo(() => {
    return ALL_COMMANDS.filter((cmd) => {
      // Navigation & Cheat sheet are always available
      if (cmd.category === 'navigation' || cmd.id === 'shortcuts-cheat') {
        return true
      }
      // Actions/Documents are available only if their action handler is registered in current page context
      return isActionAvailable(cmd.id)
    })
  }, [isActionAvailable, isOpen]) // Re-evaluate when opened or when context actions change

  // 3. Search matching & filtering
  const filteredCommands = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    if (!query) return availableCommands

    return availableCommands.filter((cmd) => {
      return (
        cmd.title.toLowerCase().includes(query) ||
        cmd.subtitle.toLowerCase().includes(query) ||
        cmd.category.toLowerCase().includes(query) ||
        (cmd.keywords && cmd.keywords.some((k) => k.toLowerCase().includes(query)))
      )
    })
  }, [availableCommands, searchQuery])

  // Reset active index when search results change
  useEffect(() => {
    setActiveIndex(0)
  }, [searchQuery])

  // 4. Keyboard Arrow/Enter Navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => (prev + 1) % filteredCommands.length)
      scrollActiveIntoView()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length)
      scrollActiveIntoView()
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredCommands[activeIndex]) {
        selectCommand(filteredCommands[activeIndex])
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setIsOpen(false)
    }
  }

  const scrollActiveIntoView = () => {
    setTimeout(() => {
      const activeEl = listRef.current?.querySelector('[aria-selected="true"]')
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' })
      }
    }, 10)
  }

  const selectCommand = (command: CommandItem) => {
    setIsOpen(false)
    
    // Check Navigation
    if (command.id.startsWith('nav-')) {
      const route = command.id.replace('nav-', '')
      navigate(`/${route}`)
      return
    }

    // Check System Help
    if (command.id === 'shortcuts-cheat') {
      // Toggle help cheat sheet
      setTimeout(() => {
        setIsOpen(true)
        setShowCheatSheet(true)
      }, 100)
      return
    }

    // Execute Context Action
    executeAction(command.id)
  }

  // Backdrop overlay click close handler
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      setIsOpen(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center pt-[15vh] px-4 animate-[fadeIn_0.1s_ease-out]"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div className="w-full max-w-lg bg-card border border-border/80 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[50vh] animate-[scaleIn_0.12s_ease-out]">
        
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 border-b border-border bg-muted/5 shrink-0">
          <Search className="h-4.5 w-4.5 text-muted-foreground/60 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder={showCheatSheet ? "Shortcuts menu... Press Esc to go back" : "Type a command or search..."}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              if (showCheatSheet) setShowCheatSheet(false)
            }}
            onKeyDown={handleKeyDown}
            className="w-full h-12 text-sm text-foreground bg-transparent border-0 focus:outline-none placeholder:text-muted-foreground/50"
            aria-autocomplete="list"
            aria-controls="command-list"
            aria-activedescendant={`cmd-option-${activeIndex}`}
          />
          <div className="text-[10px] text-muted-foreground bg-muted/65 border border-border px-1.5 py-0.5 rounded font-mono select-none">
            ESC
          </div>
        </div>

        {/* Dynamic Display Area */}
        <div 
          ref={listRef} 
          id="command-list"
          role="listbox" 
          className="flex-1 overflow-y-auto p-2"
        >
          {showCheatSheet ? (
            /* Sub-view: Shortcuts Cheat Sheet */
            <div className="p-3 flex flex-col gap-4 text-left">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <h3 className="text-xs font-semibold text-primary uppercase tracking-wider">
                  Keyboard Shortcuts Cheat Sheet
                </h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowCheatSheet(false)}
                  className="h-6 text-[10px] text-muted-foreground"
                >
                  Back to commands
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                {[
                  { keys: '⌘ + K', desc: 'Toggle Command Palette' },
                  { keys: '⌘ + Enter', desc: 'Run Pipeline / Resume Stream' },
                  { keys: '⌘ + Shift + N', desc: 'New Document / Reset Workspace' },
                  { keys: '⌘ + S', desc: 'Download Document (PDF)' },
                  { keys: 'Escape', desc: 'Close dialogues, drawers, or command palette' },
                ].map((sc, i) => (
                  <div key={i} className="flex items-center justify-between text-xs text-foreground/90 border-b border-border/40 pb-1.5 last:border-0">
                    <span className="font-medium">{sc.desc}</span>
                    <span className="font-mono text-[10px] text-muted-foreground bg-muted border border-border px-1.5 py-0.2 rounded">
                      {sc.keys}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : searchQuery === '' && filteredCommands.length > 0 ? (
            /* Initial Open View: Recent commands list & suggestions */
            <div className="flex flex-col gap-1">
              <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-left">
                Suggested Commands
              </div>
              {filteredCommands.map((command, idx) => {
                const Icon = command.icon
                const isSelected = activeIndex === idx
                return (
                  <div
                    key={command.id}
                    id={`cmd-option-${idx}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => selectCommand(command)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-left ${
                      isSelected ? 'bg-primary/8 text-primary' : 'text-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground/80 group-hover:text-primary" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold">{command.title}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.2 truncate">
                        {command.subtitle}
                      </div>
                    </div>
                    {command.shortcut && (
                      <span className="font-mono text-[10px] text-muted-foreground bg-muted border border-border/80 px-1.5 py-0.2 rounded select-none shrink-0">
                        {command.shortcut}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          ) : filteredCommands.length === 0 ? (
            /* Search No Results State */
            <div className="py-8 px-4 text-center">
              <HelpCircle className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <div className="text-sm font-medium text-foreground">No commands found</div>
              <div className="text-xs text-muted-foreground mt-1">
                We couldn't find any commands matching "{searchQuery}".
              </div>
            </div>
          ) : (
            /* Fuzzy Match Filtered List */
            <div className="flex flex-col gap-1">
              {filteredCommands.map((command, idx) => {
                const Icon = command.icon
                const isSelected = activeIndex === idx
                return (
                  <div
                    key={command.id}
                    id={`cmd-option-${idx}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => selectCommand(command)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-left ${
                      isSelected ? 'bg-primary/8 text-primary' : 'text-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground/80 group-hover:text-primary" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold">{command.title}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.2 truncate">
                        {command.subtitle}
                      </div>
                    </div>
                    {command.shortcut && (
                      <span className="font-mono text-[10px] text-muted-foreground bg-muted border border-border/80 px-1.5 py-0.2 rounded select-none shrink-0">
                        {command.shortcut}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
