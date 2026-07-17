import React, { useState, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Clock, Search, Trash2, Plus, FileText, Star, SlidersHorizontal, Sparkles, Info } from 'lucide-react'
import { useHistory } from '@/hooks/useHistory'
import { HistoryCard } from '@/components/history/HistoryCard'
import { PreviewDrawer } from '@/components/history/PreviewDrawer'
import type { HistoryEntry } from '@/services/historyDB'
import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'

// Reusable config-driven draft templates array for the empty state
const DRAFT_TEMPLATES = [
  {
    title: 'Chatbot Launch Plan',
    description: 'Project plan for launching an AI-powered customer support chatbot.',
    prompt: 'Create a project plan for launching an AI-powered customer support chatbot in a remote team context.',
    mode: 'standard',
  },
  {
    title: 'Distributed Onboarding Blueprint',
    description: 'Onboarding roadmap for remote engineering personnel.',
    prompt: 'We need to improve customer onboarding because users are dropping off, but we don\'t know exactly where...',
    mode: 'advanced',
  },
  {
    title: 'SaaS Pitch Proposal',
    description: 'Pitch proposal presenting enterprise cloud services.',
    prompt: 'Synthesize a formal pitch proposal for enterprise cloud services targeting executive stakeholders.',
    mode: 'standard',
  },
]

export const HistoryPage: React.FC = () => {
  const { entries, isLoading, removeEntry, updateEntry, duplicateEntry, clearAll } = useHistory()
  const [searchQuery, setSearchQuery] = useState('')
  const [formatFilter, setFormatFilter] = useState<string>('all')
  const [modeFilter, setModeFilter] = useState<string>('all')
  const [favoritesOnly, setFavoritesOnly] = useState<boolean>(false)
  const [sortBy, setSortBy] = useState<string>('newest')
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (location.state?.selectedId && entries.length > 0) {
      const match = entries.find((e) => e.id === location.state.selectedId)
      if (match) {
        setSelectedEntry(match)
        // Clear state so it doesn't reopen drawer on page refresh or filter
        navigate('/history', { replace: true, state: {} })
      }
    }
  }, [location.state, entries, navigate])

  // 1. Memoized list of the last 3 generated documents (uncorrupted by search/filtering rules)
  const recentEntries = useMemo(() => {
    return [...entries]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3)
  }, [entries])

  // 2. Memoized, filtered, and sorted history entries list
  const processedEntries = useMemo(() => {
    // A. Filter entries
    let result = entries.filter((entry) => {
      // Full text search (matches prompt, title, and synopsis/summary)
      const query = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !query ||
        entry.prompt.toLowerCase().includes(query) ||
        (entry.title && entry.title.toLowerCase().includes(query)) ||
        (entry.summary && entry.summary.toLowerCase().includes(query)) ||
        (entry.document_filename && entry.document_filename.toLowerCase().includes(query))

      // Format filter (PDF / Word / Markdown)
      const matchesFormat =
        formatFilter === 'all' || (entry.format || 'pdf').toLowerCase() === formatFilter

      // Execution mode filter (Standard / Advanced / Adaptive)
      const matchesMode =
        modeFilter === 'all' || (entry.mode || 'standard').toLowerCase() === modeFilter

      // Favorites Only toggle filter
      const matchesFavorites = !favoritesOnly || !!entry.is_favorite

      return matchesSearch && matchesFormat && matchesMode && matchesFavorites
    })

    // B. Sort entries
    result.sort((a, b) => {
      // Newest First (default)
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
      // Oldest First
      if (sortBy === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      }
      // Title: A-Z
      if (sortBy === 'title-asc') {
        const titleA = (a.title || a.prompt).toLowerCase()
        const titleB = (b.title || b.prompt).toLowerCase()
        return titleA.localeCompare(titleB)
      }
      // Title: Z-A
      if (sortBy === 'title-desc') {
        const titleA = (a.title || a.prompt).toLowerCase()
        const titleB = (b.title || b.prompt).toLowerCase()
        return titleB.localeCompare(titleA)
      }
      return 0
    })

    return result
  }, [entries, searchQuery, formatFilter, modeFilter, favoritesOnly, sortBy])

  const displayedEntries = useMemo(() => {
    if (!searchQuery.trim()) {
      return processedEntries.slice(0, 3)
    }
    return processedEntries
  }, [processedEntries, searchQuery])

  const handleClearAll = () => {
    if (
      window.confirm(
        'Are you sure you want to clear all document generation history? This action cannot be undone.'
      )
    ) {
      clearAll()
      setSelectedEntry(null)
    }
  }

  // Template prompt click handler - navigates to GeneratePage with state
  const handleSelectTemplate = (prompt: string, mode: string) => {
    navigate('/generate', { state: { prompt, mode } })
  }

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Document Library</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review, search, sort, and duplicate your previously generated document drafts.
          </p>
        </div>
        {entries.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            className="text-destructive hover:text-destructive hover:bg-destructive/5 shrink-0 border-destructive/20 hover:border-destructive/30 cursor-pointer self-start md:self-auto gap-2"
          >
            <Trash2 className="h-4 w-4" /> Clear Library
          </Button>
        )}
      </div>

      {/* Recent Documents Row */}
      {entries.length > 0 && !isLoading && (
        <div className="flex flex-col gap-2.5">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 pl-0.5">
            <Clock className="h-3.5 w-3.5" /> Recent Documents
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentEntries.map((item) => (
              <Card
                key={`recent-${item.id}`}
                className="hover-lift group border border-border/75 cursor-pointer bg-card/45 hover:bg-card hover:shadow-sm shadow-2xs"
                onClick={() => setSelectedEntry(item)}
              >
                <CardContent className="p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-primary bg-primary/8 px-1.5 py-0.2 rounded uppercase shrink-0">
                      {(item.format || 'pdf').toUpperCase()}
                    </span>
                    {item.is_favorite && (
                      <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500 shrink-0" />
                    )}
                  </div>
                  <h3 className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors pr-1">
                    {item.title || item.prompt}
                  </h3>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    {new Date(item.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Main Document Library Controls & Listings */}
      <Card className="border-border shadow-sm">
        <CardHeader className="border-b border-border pb-4 flex flex-col gap-4 bg-muted/10">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-base flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" /> Document Finder & Filters
            </CardTitle>
            <CardDescription className="flex flex-col gap-1.5">
              <span>Narrow down document lists by query keywords, formats, modes, or favorites toggle.</span>
              {entries.length > 0 && (
                <div className="flex items-start gap-3 mt-2 bg-emerald-500/10 border border-emerald-500/25 px-4 py-3 rounded-lg w-full max-w-xl shadow-xs select-none animate-[fadeIn_0.2s_ease-out]">
                  <Info className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      Document Display Limit
                    </span>
                    <span className="text-[11px] text-emerald-700/90 dark:text-emerald-400/80 leading-normal font-medium">
                      Showing your 3 most recent documents. Use the search bar below to access up to your last 10 saved generations.
                    </span>
                  </div>
                </div>
              )}
            </CardDescription>
          </div>

          {/* Filtering Control Bar */}
          {entries.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
              {/* Keyword Search */}
              <div className="relative col-span-1 lg:col-span-2">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search title, prompt, synopsis..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 w-full bg-background"
                />
              </div>

              {/* Format Filter Selection */}
              <div className="flex flex-col gap-1 text-left">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">
                  Format
                </label>
                <Select value={formatFilter} onValueChange={(val) => setFormatFilter(val || 'all')}>
                  <SelectTrigger className="h-9 w-full bg-background">
                    <SelectValue placeholder="All Formats" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Formats</SelectItem>
                    <SelectItem value="pdf">PDF Documents</SelectItem>
                    <SelectItem value="docx">Word (DOCX)</SelectItem>
                    <SelectItem value="md">Markdown (MD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Strategy Filter Selection */}
              <div className="flex flex-col gap-1 text-left">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">
                  Execution Strategy
                </label>
                <Select value={modeFilter} onValueChange={(val) => setModeFilter(val || 'all')}>
                  <SelectTrigger className="h-9 w-full bg-background">
                    <SelectValue placeholder="All Strategies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Strategies</SelectItem>
                    <SelectItem value="standard">Standard Strategy</SelectItem>
                    <SelectItem value="advanced">Advanced Strategy</SelectItem>
                    <SelectItem value="adaptive">Adaptive Strategy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Dropdown Selection */}
              <div className="flex flex-col gap-1 text-left">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">
                  Sort By
                </label>
                <Select value={sortBy} onValueChange={(val) => setSortBy(val || 'newest')}>
                  <SelectTrigger className="h-9 w-full bg-background">
                    <SelectValue placeholder="Sort order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="title-asc">Title: A-Z</SelectItem>
                    <SelectItem value="title-desc">Title: Z-A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Toggle Switch Favorites Only bar */}
          {entries.length > 0 && (
            <div className="flex items-center gap-3 pl-1 pt-1">
              <Switch
                id="favorites-only-switch"
                checked={favoritesOnly}
                onCheckedChange={setFavoritesOnly}
              />
              <label
                htmlFor="favorites-only-switch"
                className="text-xs font-medium text-foreground cursor-pointer select-none flex items-center gap-1.5"
              >
                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" /> Show Starred/Favorites Only
              </label>
            </div>
          )}
        </CardHeader>

        <CardContent className="pt-6">
          {isLoading ? (
            /* Loading State Skeleton */
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-28 w-full bg-muted/20 animate-pulse rounded-lg border border-border/60"
                />
              ))}
            </div>
          ) : entries.length === 0 ? (
            /* Empty State with draft templates config */
            <div className="flex flex-col gap-6 items-center py-6 text-center max-w-xl mx-auto">
              <EmptyState
                title="Your Document Library is empty"
                description="Generated documents automatically appear here and remain available locally for future access. Get started instantly with one of our business blueprint templates:"
                icon={FileText}
                action={
                  <Button onClick={() => navigate('/generate')} className="gap-2 cursor-pointer">
                    <Plus className="h-4 w-4" /> Start Custom Draft
                  </Button>
                }
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 w-full mt-2">
                {DRAFT_TEMPLATES.map((tpl, i) => (
                  <Card
                    key={`template-${i}`}
                    className="hover-lift border border-border/80 bg-muted/10 hover:bg-card text-left cursor-pointer p-4 flex flex-col justify-between shadow-2xs"
                    onClick={() => handleSelectTemplate(tpl.prompt, tpl.mode)}
                  >
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5 text-primary">
                        <Sparkles className="h-3.5 w-3.5" />
                        <h4 className="text-xs font-bold leading-tight">{tpl.title}</h4>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-normal font-normal">
                        {tpl.description}
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold text-primary/80 mt-3 hover:underline">
                      Use Template →
                    </span>
                  </Card>
                ))}
              </div>
            </div>
          ) : processedEntries.length === 0 ? (
            /* Search/Filter No Results State */
            <EmptyState
              title="No matching documents found"
              description="We couldn't find any documents matching your select search queries or filters. Try adjusting query terms or filters."
              icon={Search}
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('')
                    setFormatFilter('all')
                    setModeFilter('all')
                    setFavoritesOnly(false)
                  }}
                  className="cursor-pointer"
                >
                  Clear Filters & Reset
                </Button>
              }
            />
          ) : (
            /* History Listing Grid */
            <div className="grid grid-cols-1 gap-4 main-history-list">
              {displayedEntries.map((entry) => (
                <HistoryCard
                  key={entry.id}
                  entry={entry}
                  onPreview={setSelectedEntry}
                  onDelete={removeEntry}
                  onUpdate={updateEntry}
                  onDuplicate={duplicateEntry}
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
        onUpdate={updateEntry}
      />
    </div>
  )
}

export default HistoryPage
