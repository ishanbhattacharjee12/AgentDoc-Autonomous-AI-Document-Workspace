import React, { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Sparkles, Clock, Settings, Menu, X, FileText } from 'lucide-react'
import { useHistory } from '@/hooks/useHistory'
import { deriveDocumentTitle } from '@/utils/historyHelpers'

interface SidebarProps {
  usage?: {
    used: number
    limit: number
  }
}

interface ActiveRun {
  prompt: string
  format: string
  mode: string
  status: string
  timestamp: string
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
  })
}

export const Sidebar: React.FC<SidebarProps> = ({
  usage
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()
  const { entries, isLoading } = useHistory()

  const [activeRun, setActiveRun] = useState<ActiveRun | null>(() => {
    const status = (window as any).__agentdoc_active_status
    if (status && status !== 'idle') {
      return {
        prompt: (window as any).__agentdoc_active_prompt || '',
        format: (window as any).__agentdoc_active_format || 'pdf',
        mode: (window as any).__agentdoc_active_mode || 'standard',
        status: status,
        timestamp: (window as any).__agentdoc_active_timestamp || new Date().toISOString()
      }
    }
    return null
  })

  useEffect(() => {
    const handleStatusChange = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail && detail.status && detail.status !== 'idle') {
        setActiveRun({
          prompt: detail.requestText || '',
          format: detail.format || 'pdf',
          mode: detail.mode || 'standard',
          status: detail.status,
          timestamp: (window as any).__agentdoc_active_timestamp || new Date().toISOString()
        })
      } else {
        setActiveRun(null)
      }
    }
    
    window.addEventListener('agentdoc-status-change', handleStatusChange)
    return () => {
      window.removeEventListener('agentdoc-status-change', handleStatusChange)
    }
  }, [])

  const sortedEntries = React.useMemo(() => {
    const dbEntries = [...entries]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    
    if (activeRun && activeRun.status !== 'completed') {
      const latestDbEntry = dbEntries[0]
      if (latestDbEntry && latestDbEntry.prompt === activeRun.prompt && (Date.now() - new Date(latestDbEntry.created_at).getTime()) < 5000) {
        return dbEntries.slice(0, 3)
      }
      
      const virtualEntry = {
        id: -1,
        prompt: activeRun.prompt,
        title: deriveDocumentTitle(undefined, activeRun.prompt, undefined, activeRun.mode),
        format: activeRun.format,
        mode: activeRun.mode,
        created_at: activeRun.timestamp,
        status: activeRun.status
      }
      return [virtualEntry, ...dbEntries].slice(0, 3)
    }
    
    return dbEntries.slice(0, 3)
  }, [entries, activeRun])

  const handleNavigate = (entry: any) => {
    if (entry.id === -1) {
      navigate('/generate')
    } else {
      navigate('/history', { state: { selectedId: entry.id } })
    }
  }

  const renderStatusBadge = (status: string) => {
    const normalized = status.toLowerCase()
    
    if (normalized === 'completed' || normalized === 'success') {
      return (
        <span className="inline-flex items-center px-1.5 py-0.2 text-[8px] font-bold rounded-sm bg-teal-500/10 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300 uppercase tracking-wide">
          Completed
        </span>
      )
    }
    
    if (normalized === 'reviewing' || normalized === 'needs_review') {
      return (
        <span className="inline-flex items-center px-1.5 py-0.2 text-[8px] font-bold rounded-sm border border-amber-500/30 text-amber-700 dark:text-amber-400 uppercase tracking-wide bg-transparent">
          Needs Review
        </span>
      )
    }
    
    if (normalized === 'error' || normalized === 'failed') {
      return (
        <span className="inline-flex items-center px-1.5 py-0.2 text-[8px] font-bold rounded-sm bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-300 uppercase tracking-wide">
          Failed
        </span>
      )
    }
    
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 text-[8px] font-bold rounded-sm bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 uppercase tracking-wide">
        <span className="h-1 w-1 rounded-full bg-amber-500 animate-pulse" />
        Running
      </span>
    )
  }

  const activeUsed = usage?.used ?? entries.length ?? 8
  const activeLimit = usage?.limit ?? 20

  const firstEntry = sortedEntries[0]
  const remainingEntries = sortedEntries.slice(1)

  const navItems = [
    {
      to: '/generate',
      icon: Sparkles,
      title: 'Generate',
      subtitle: 'Create document',
    },
    {
      to: '/history',
      icon: Clock,
      title: 'History',
      subtitle: 'Recent drafts',
    },
    {
      to: '/settings',
      icon: Settings,
      title: 'Settings',
      subtitle: 'Configuration',
    },
  ]

  return (
    <>
      {/* Mobile Header bar */}
      <header className="flex md:hidden items-center justify-between px-4 py-3 bg-card border-b border-border sticky top-0 z-30 w-full">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FileText className="h-5 w-5" />
          </div>
          <span className="font-semibold text-foreground tracking-tight">AgentDoc</span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 rounded-md text-muted-foreground hover:bg-muted focus:outline-none"
          aria-label="Toggle Navigation Menu"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* Sidebar navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-20 flex w-[275px] flex-col border-r border-border bg-card transition-transform duration-300 md:sticky md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo Section */}
        <div className="hidden md:flex h-[88px] items-center gap-3 px-6 border-b border-border">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0 shadow-xs">
            <FileText className="h-6.5 w-6.5" />
          </div>
          <div className="flex flex-col justify-center min-w-0">
            <span className="font-extrabold text-foreground tracking-tight text-[25px] block leading-none">AgentDoc</span>
            <span className="text-[9px] text-muted-foreground/85 font-semibold uppercase tracking-wider mt-1.5 block truncate">AI Document Workspace</span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1.5 p-4">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={(e) => {
                  if ((window as any).__agentdoc_generating) {
                    e.preventDefault()
                    e.stopPropagation()
                    alert("A document is currently being generated. Please wait or cancel the active run before navigating.")
                    return
                  }
                  setIsOpen(false)
                }}
                className={({ isActive }) => {
                  const isGenerating = (window as any).__agentdoc_generating;
                  return `flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 group border border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    isGenerating
                      ? 'opacity-40 cursor-not-allowed text-muted-foreground'
                      : isActive
                        ? 'bg-primary/8 border-primary/10 text-primary font-semibold shadow-xs'
                        : 'text-muted-foreground hover:bg-muted/65 hover:text-foreground'
                  }`
                }}
              >
                <Icon className="h-5 w-5 shrink-0 transition-colors" />
                <div className="flex flex-col text-left">
                  <span className="text-sm font-semibold leading-tight">{item.title}</span>
                  <span className="text-[11px] text-muted-foreground group-hover:text-muted-foreground/80 mt-0.5 font-normal">
                    {item.subtitle}
                  </span>
                </div>
              </NavLink>
            )
          })}
        </nav>

        {/* Center Whitespace Spacer */}
        <div className="flex-1" />
        
        {/* WORKSPACE ACTIVITY sidebar card */}
        <div className="mx-4 my-3 p-3 bg-background border border-[#E3E5DE] rounded-lg text-left hidden md:block select-none shadow-2xs">
          <span className="text-[10px] font-bold text-[#5C6B63] uppercase tracking-wider block mb-2.5">
            WORKSPACE ACTIVITY
          </span>
          
          {sortedEntries.length === 0 && !isLoading ? (
            <div className="text-center py-6 text-muted-foreground text-xs font-normal">
              No recent activity
            </div>
          ) : (
            <>
              {/* Most Recent Document (First Entry) */}
              {firstEntry && (
                <div 
                  onClick={() => handleNavigate(firstEntry)}
                  className="group/item flex items-start gap-2.5 p-2 rounded-md hover:bg-muted/40 cursor-pointer transition-all duration-200 mb-3 border border-transparent hover:border-[#E3E5DE]/40"
                >
                  {/* Future-proof thumbnail container / Icon slot */}
                  <div className="h-9 w-7 bg-muted/40 border border-border/50 rounded flex items-center justify-center text-muted-foreground/80 shrink-0 shadow-2xs group-hover/item:bg-background transition-colors">
                    <FileText className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <span className="text-xs font-bold text-foreground truncate group-hover/item:text-primary transition-colors">
                      {firstEntry.title || deriveDocumentTitle(firstEntry.title, firstEntry.prompt, undefined, firstEntry.mode)}
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9px] font-bold text-muted-foreground/80 uppercase">
                        {firstEntry.format.toUpperCase()}
                      </span>
                      <span className="text-[9px] text-muted-foreground/50 font-normal">·</span>
                      {renderStatusBadge(firstEntry.status || 'completed')}
                      <span className="text-[9px] text-muted-foreground/50 font-normal">·</span>
                      <span className="text-[9px] text-muted-foreground font-normal whitespace-nowrap">
                        {formatRelativeTime(firstEntry.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Remaining two entries */}
              {remainingEntries.length > 0 && (
                <div className="space-y-2 border-t border-[#E3E5DE] pt-2.5 mb-3">
                  {remainingEntries.map((entry) => (
                    <div
                      key={entry.id}
                      onClick={() => handleNavigate(entry)}
                      className="group/sub flex items-center gap-2 p-1.5 rounded hover:bg-muted/40 cursor-pointer transition-all duration-150"
                    >
                      <FileText className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0 group-hover/sub:text-primary transition-colors" />
                      <div className="flex-1 min-w-0 flex flex-col">
                        <span className="text-[11px] font-semibold text-foreground truncate group-hover/sub:text-primary transition-colors">
                          {entry.title || deriveDocumentTitle(entry.title, entry.prompt, undefined, entry.mode)}
                        </span>
                        <div className="flex items-center gap-1 mt-0.5 text-[9px] text-muted-foreground font-normal">
                          <span className="uppercase font-bold">{entry.format.toUpperCase()}</span>
                          <span>·</span>
                          <span>{entry.status === 'error' ? 'Failed' : entry.status === 'reviewing' ? 'Needs Review' : 'Completed'}</span>
                          <span>·</span>
                          <span>{formatRelativeTime(entry.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Monthly Usage section */}
          <div className="border-t border-[#E3E5DE] pt-2.5">
            <div className="flex justify-between items-center text-[10px] font-bold mb-1 text-muted-foreground/90 uppercase tracking-wider">
              <span>Monthly Usage</span>
              <span className="text-foreground font-bold">{activeUsed} of {activeLimit} reports</span>
            </div>
            <div className="h-1 w-full bg-[#EDF3EF] dark:bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-teal-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (activeUsed / activeLimit) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border bg-muted/20">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-semibold text-sm">
              AD
            </div>
            <div className="flex flex-col text-left overflow-hidden">
              <span className="text-xs font-semibold text-foreground truncate">AgentDoc Client</span>
              <span className="text-[10px] text-muted-foreground truncate">v1.0.0</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-10 bg-background/80 backdrop-blur-sm md:hidden"
        />
      )}
    </>
  )
}
