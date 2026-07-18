import React, { useState, useEffect, useRef } from 'react'
import type { HistoryEntry } from '@/services/historyDB'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, Download, FileText, Clock, Cpu, Zap, Pencil } from 'lucide-react'
import { getDocumentDownloadUrl } from '@/services/api'
import { deriveDocumentTitle, deriveDocumentSummary } from '@/utils/historyHelpers'

interface PreviewDrawerProps {
  entry: HistoryEntry | null
  onClose: () => void
  onUpdate: (id: number, updates: Partial<HistoryEntry>) => void
}

export const PreviewDrawer: React.FC<PreviewDrawerProps> = ({ entry, onClose, onUpdate }) => {
  const formatLabel = (entry?.format || 'pdf').toUpperCase()
  
  const derivedTitle = React.useMemo(() => {
    if (!entry) return ''
    return deriveDocumentTitle(entry.title, entry.prompt, undefined, entry.mode)
  }, [entry?.title, entry?.prompt, entry?.mode])

  const derivedSummary = React.useMemo(() => {
    if (!entry) return ''
    return deriveDocumentSummary(entry.summary, undefined, undefined)
  }, [entry?.summary])

  const [isEditing, setIsEditing] = useState(false)
  const [tempTitle, setTempTitle] = useState(entry?.title || derivedTitle)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (entry) {
      setTempTitle(entry.title || derivedTitle)
    }
  }, [entry?.title, derivedTitle])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  if (!entry) return null

  const handleSave = () => {
    setIsEditing(false)
    if (tempTitle.trim() && tempTitle !== entry.title && entry.id != null) {
      onUpdate(entry.id, { title: tempTitle.trim() })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
      setTempTitle(entry.title || '')
    }
  }

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/35 z-40 animate-[fadeIn_0.15s_ease-out]"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <aside
        className="fixed top-0 right-0 h-full w-full max-w-lg bg-background border-l border-border shadow-2xl z-50 flex flex-col animate-[slideInRight_0.2s_ease-out]"
        role="dialog"
        aria-modal="true"
        aria-label="Document preview"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/10 shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="h-4.5 w-4.5 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Document Details</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-muted-foreground cursor-pointer"
            aria-label="Close preview"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Editable Title Section */}
          <div className="px-6 py-5 border-b border-border bg-muted/5">
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className="w-full text-base font-bold text-foreground bg-muted/40 border border-primary/30 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background"
              />
            ) : (
              <div className="flex items-start justify-between gap-2 group/drawer-title">
                <h1 className="text-base font-bold text-foreground leading-snug">
                  {derivedTitle}
                </h1>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground/50 hover:text-primary opacity-0 group-hover/drawer-title:opacity-100 focus:opacity-100 transition-opacity rounded cursor-pointer shrink-0 mt-0.5"
                  onClick={() => setIsEditing(true)}
                  aria-label="Rename document"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Prompt section */}
          <div className="px-6 py-5 border-b border-border">
            <p className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider mb-2">
              Original Prompt
            </p>
            <p className="text-sm text-foreground/90 leading-relaxed font-normal">
              {entry.prompt}
            </p>
          </div>

          {/* Metadata grid */}
          <div className="px-6 py-4 border-b border-border grid grid-cols-2 gap-3.5 bg-muted/5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5 text-muted-foreground/75" />
              <span>{new Date(entry.created_at).toLocaleString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
                hour: 'numeric', minute: '2-digit',
              })}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/20 text-primary bg-primary/4 uppercase font-medium">
                {formatLabel}
              </Badge>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 capitalize text-muted-foreground bg-muted/70">
                {entry.mode || 'standard'}
              </Badge>
            </div>
            {entry.time_taken != null && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Zap className="h-3.5 w-3.5 text-muted-foreground/75" />
                <span>{entry.time_taken.toFixed(1)}s generation</span>
              </div>
            )}
            {entry.active_model && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Cpu className="h-3.5 w-3.5 text-muted-foreground/75" />
                <span className="truncate">{entry.active_model}</span>
              </div>
            )}
          </div>

          {/* Summary section */}
          <div className="px-6 py-5">
            <p className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider mb-3">
              Document Summary
            </p>
            {derivedSummary ? (
              <div className="prose prose-sm max-w-none text-foreground/90 leading-relaxed text-sm font-normal">
                {derivedSummary}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic font-normal">
                No summary available for this document.
              </p>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-border bg-muted/10 shrink-0 flex items-center gap-3">
          <a
            href={getDocumentDownloadUrl(entry.document_filename)}
            download
            className="inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-colors bg-primary hover:bg-[#1f5547] text-primary-foreground shadow-sm h-10 flex-1 gap-2 cursor-pointer"
          >
            <Download className="h-4 w-4" /> Download {formatLabel}
          </a>
          <Button
            variant="outline"
            className="h-10 cursor-pointer text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </aside>
    </>
  )
}
