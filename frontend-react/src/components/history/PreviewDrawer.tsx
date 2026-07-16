import React from 'react'
import type { HistoryEntry } from '@/services/historyDB'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, Download, FileText, Clock, Cpu, Zap } from 'lucide-react'
import { getDocumentDownloadUrl } from '@/services/api'

interface PreviewDrawerProps {
  entry: HistoryEntry | null
  onClose: () => void
}

export const PreviewDrawer: React.FC<PreviewDrawerProps> = ({ entry, onClose }) => {
  if (!entry) return null

  const formatLabel = (entry.format || 'pdf').toUpperCase()

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/30 z-40 animate-[fadeIn_0.15s_ease-out]"
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
            <FileText className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Document Preview</h2>
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
          {/* Prompt section */}
          <div className="px-6 py-5 border-b border-border">
            <p className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider mb-2">
              Original Prompt
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              {entry.prompt}
            </p>
          </div>

          {/* Metadata grid */}
          <div className="px-6 py-4 border-b border-border grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>{new Date(entry.created_at).toLocaleString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
                hour: 'numeric', minute: '2-digit',
              })}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/20 text-primary">
                {formatLabel}
              </Badge>
              <span className="capitalize">{entry.mode || 'standard'}</span>
            </div>
            {entry.time_taken != null && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Zap className="h-3.5 w-3.5" />
                <span>{entry.time_taken.toFixed(1)}s pipeline</span>
              </div>
            )}
            {entry.active_model && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Cpu className="h-3.5 w-3.5" />
                <span>{entry.active_model}</span>
              </div>
            )}
            {entry.llm_call_count != null && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground col-span-2">
                <span>{entry.llm_call_count} LLM calls</span>
              </div>
            )}
          </div>

          {/* Summary section */}
          <div className="px-6 py-5">
            <p className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider mb-3">
              Document Summary
            </p>
            {entry.summary ? (
              <div className="prose prose-sm max-w-none text-foreground leading-relaxed text-sm">
                {entry.summary}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No summary available for this document.
              </p>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-border bg-muted/5 shrink-0 flex items-center gap-3">
          <a
            href={getDocumentDownloadUrl(entry.document_filename)}
            download
            className="inline-flex items-center justify-center rounded-md text-sm font-semibold transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/95 h-10 flex-1 gap-2"
          >
            <Download className="h-4 w-4" /> Download {formatLabel}
          </a>
          <Button
            variant="outline"
            className="h-10 cursor-pointer"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </aside>
    </>
  )
}
