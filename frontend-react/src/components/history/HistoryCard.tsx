import React from 'react'
import type { HistoryEntry } from '@/services/historyDB'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, Download, Eye, Trash2, Clock } from 'lucide-react'
import { getDocumentDownloadUrl } from '@/services/api'

interface HistoryCardProps {
  entry: HistoryEntry
  onPreview: (entry: HistoryEntry) => void
  onDelete: (id: number) => void
}

function formatRelativeTime(isoString: string): string {
  const now = Date.now()
  const then = new Date(isoString).getTime()
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60_000)
  const diffHr = Math.floor(diffMs / 3_600_000)
  const diffDay = Math.floor(diffMs / 86_400_000)

  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: diffDay > 365 ? 'numeric' : undefined,
  })
}

function truncatePrompt(prompt: string, maxLen = 120): string {
  if (prompt.length <= maxLen) return prompt
  return prompt.slice(0, maxLen).trimEnd() + '…'
}

export const HistoryCard: React.FC<HistoryCardProps> = ({
  entry,
  onPreview,
  onDelete,
}) => {
  const formatLabel = (entry.format || 'pdf').toUpperCase()

  return (
    <Card className="group border-border hover:border-primary/20 hover:shadow-md transition-all cursor-pointer bg-card">
      <CardContent className="p-4 flex flex-col gap-3" onClick={() => onPreview(entry)}>
        {/* Row 1: Icon + prompt + format badge */}
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/8 text-primary shrink-0 mt-0.5">
            <FileText className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground leading-snug line-clamp-2">
              {truncatePrompt(entry.prompt)}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/20 text-primary font-medium">
                {formatLabel}
              </Badge>
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatRelativeTime(entry.created_at)}
              </span>
              {entry.time_taken != null && (
                <span className="text-[11px] text-muted-foreground">
                  · {entry.time_taken.toFixed(1)}s
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: Summary preview */}
        {entry.summary && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 pl-12">
            {entry.summary}
          </p>
        )}

        {/* Row 3: Actions — visible on hover */}
        <div className="flex items-center gap-2 pl-12 pt-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5 cursor-pointer"
            onClick={() => onPreview(entry)}
          >
            <Eye className="h-3 w-3" /> Preview
          </Button>
          <a
            href={getDocumentDownloadUrl(entry.document_filename)}
            download
            className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-7 px-3 gap-1.5"
          >
            <Download className="h-3 w-3" /> Download
          </a>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 ml-auto text-muted-foreground hover:text-destructive hover:bg-destructive/5 cursor-pointer"
            onClick={() => entry.id != null && onDelete(entry.id)}
            aria-label="Delete from history"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
