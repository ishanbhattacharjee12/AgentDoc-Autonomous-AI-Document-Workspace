import React, { useState, useEffect, useRef } from 'react'
import type { HistoryEntry } from '@/services/historyDB'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, Download, Eye, Trash2, Clock, Star, Copy, Pencil } from 'lucide-react'
import { getDocumentDownloadUrl } from '@/services/api'

interface HistoryCardProps {
  entry: HistoryEntry
  onPreview: (entry: HistoryEntry) => void
  onDelete: (id: number) => void
  onUpdate: (id: number, updates: Partial<HistoryEntry>) => void
  onDuplicate: (id: number) => void
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

export const HistoryCard: React.FC<HistoryCardProps> = ({
  entry,
  onPreview,
  onDelete,
  onUpdate,
  onDuplicate,
}) => {
  const formatLabel = (entry.format || 'pdf').toUpperCase()
  const [isEditing, setIsEditing] = useState(false)
  const [tempTitle, setTempTitle] = useState(entry.title || '')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTempTitle(entry.title || '')
  }, [entry.title])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

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

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (entry.id != null) {
      onUpdate(entry.id, { is_favorite: !entry.is_favorite })
    }
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent trigger if clicking on input, button, or link
    const target = e.target as HTMLElement
    if (
      target.closest('input') ||
      target.closest('button') ||
      target.closest('a')
    ) {
      return
    }
    onPreview(entry)
  }

  return (
    <Card 
      className="hover-lift group border border-border/80 cursor-pointer bg-card shadow-2xs hover:shadow-sm"
      onClick={handleCardClick}
    >
      <CardContent className="p-5 flex flex-col gap-3.5">
        {/* Row 1: Left Icon, Edit Title / Label Title, Favorite Star */}
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/8 text-primary shrink-0 mt-0.5">
            <FileText className="h-4.5 w-4.5" />
          </div>
          
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className="w-full text-sm font-semibold text-foreground bg-muted/40 border border-primary/30 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <div className="flex items-center gap-1.5 group/title">
                <h3 className="text-sm font-semibold text-foreground leading-snug truncate">
                  {entry.title || entry.prompt}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-muted-foreground/50 hover:text-primary opacity-0 group-hover/title:opacity-100 focus:opacity-100 transition-opacity rounded cursor-pointer shrink-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsEditing(true)
                  }}
                  aria-label="Rename document"
                >
                  <Pencil className="h-2.5 w-2.5" />
                </Button>
              </div>
            )}
            
            <p className="text-[11px] text-muted-foreground truncate mt-0.5" title={entry.prompt}>
              Prompt: {entry.prompt}
            </p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 rounded-full shrink-0 cursor-pointer transition-colors ${
              entry.is_favorite
                ? 'text-amber-500 hover:text-amber-600 bg-amber-50/10'
                : 'text-muted-foreground/30 hover:text-amber-500 hover:bg-muted/10'
            }`}
            onClick={toggleFavorite}
            aria-label={entry.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star className={`h-4 w-4 ${entry.is_favorite ? 'fill-amber-500' : ''}`} />
          </Button>
        </div>

        {/* Row 2: Rich synopsis snippet */}
        {entry.summary && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 pl-12 font-normal">
            {entry.summary}
          </p>
        )}

        {/* Row 3: Metadata Badges */}
        <div className="flex flex-wrap items-center gap-2.5 pl-12">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/20 text-primary bg-primary/4 font-medium uppercase">
            {formatLabel}
          </Badge>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium capitalize text-muted-foreground/80 bg-muted/60">
            {entry.mode || 'standard'}
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

        {/* Row 4: Hover-only document library action options */}
        <div className="flex items-center gap-2 pl-12 pt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
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
            className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-7 px-3 gap-1.5 cursor-pointer"
          >
            <Download className="h-3 w-3" /> Download
          </a>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground"
            onClick={() => entry.id != null && onDuplicate(entry.id)}
            aria-label="Duplicate document"
          >
            <Copy className="h-3 w-3" /> Duplicate
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 ml-auto text-muted-foreground/60 hover:text-destructive hover:bg-destructive/5 cursor-pointer"
            onClick={() => entry.id != null && onDelete(entry.id)}
            aria-label="Delete document"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
