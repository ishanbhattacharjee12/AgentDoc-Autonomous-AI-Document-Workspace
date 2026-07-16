import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Clock, Search, Trash2, Plus, FileText } from 'lucide-react'
import { useHistory } from '@/hooks/useHistory'
import { HistoryCard } from '@/components/history/HistoryCard'
import { PreviewDrawer } from '@/components/history/PreviewDrawer'
import type { HistoryEntry } from '@/services/historyDB'
import { useNavigate } from 'react-router-dom'

export const HistoryPage: React.FC = () => {
  const { entries, isLoading, removeEntry, clearAll } = useHistory()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null)
  const navigate = useNavigate()

  // Filter history entries by search query
  const filteredEntries = entries.filter((entry) => {
    const query = searchQuery.toLowerCase().trim()
    if (!query) return true
    return (
      entry.prompt.toLowerCase().includes(query) ||
      (entry.summary && entry.summary.toLowerCase().includes(query)) ||
      (entry.document_filename && entry.document_filename.toLowerCase().includes(query))
    )
  })

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all document generation history? This action cannot be undone.')) {
      clearAll()
      setSelectedEntry(null)
    }
  }

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Document History</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review, search, and download your previously generated document drafts.
          </p>
        </div>
        {entries.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            className="text-destructive hover:text-destructive hover:bg-destructive/5 shrink-0 border-destructive/20 hover:border-destructive/30 cursor-pointer self-start md:self-auto gap-2"
          >
            <Trash2 className="h-4 w-4" /> Clear All History
          </Button>
        )}
      </div>

      {/* Main Content Card */}
      <Card className="border-border shadow-sm">
        <CardHeader className="border-b border-border pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/10">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" /> Document Library
            </CardTitle>
            <CardDescription>
              A listing of all documents synthesized by the agent pipeline. Saved locally in your browser.
            </CardDescription>
          </div>

          {/* Search bar inside header */}
          {entries.length > 0 && (
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search prompt, synopsis..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 w-full bg-background"
              />
            </div>
          )}
        </CardHeader>

        <CardContent className="pt-6">
          {isLoading ? (
            /* Loading State Skeleton */
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-28 w-full bg-muted/20 animate-pulse rounded-lg border border-border/60" />
              ))}
            </div>
          ) : entries.length === 0 ? (
            /* Empty State */
            <EmptyState
              title="No generated documents yet"
              description="Your generated documents will persist locally in IndexedDB automatically. Run a new generation pipeline to populate your history list."
              icon={FileText}
              action={
                <Button onClick={() => navigate('/generate')} className="gap-2 cursor-pointer">
                  <Plus className="h-4 w-4" /> Generate New Document
                </Button>
              }
            />
          ) : filteredEntries.length === 0 ? (
            /* Search No Results State */
            <EmptyState
              title="No matching documents found"
              description={`We couldn't find any documents matching "${searchQuery}". Try adjusting your keywords or clearing the search query.`}
              icon={Search}
              action={
                <Button variant="outline" onClick={() => setSearchQuery('')} className="cursor-pointer">
                  Clear Search Query
                </Button>
              }
            />
          ) : (
            /* History Grid List */
            <div className="grid grid-cols-1 gap-4">
              {filteredEntries.map((entry) => (
                <HistoryCard
                  key={entry.id}
                  entry={entry}
                  onPreview={setSelectedEntry}
                  onDelete={removeEntry}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Slide-out Preview Drawer */}
      <PreviewDrawer
        entry={selectedEntry}
        onClose={() => setSelectedEntry(null)}
      />
    </div>
  )
}

export default HistoryPage
