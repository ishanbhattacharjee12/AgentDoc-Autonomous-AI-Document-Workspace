import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Sparkles, Clock, Settings, Menu, X, FileText, Zap, Brain } from 'lucide-react'
import { useHistory } from '@/hooks/useHistory'

interface SidebarProps {
  usage?: {
    used: number
    limit: number
  }
}

export const Sidebar: React.FC<SidebarProps> = ({
  usage
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const { entries } = useHistory()

  // Calculate Metrics from history
  const avgQuality = React.useMemo(() => {
    const qualities = entries
      .map((e) => e.metadata?.quality)
      .filter(Boolean) as string[]
    if (qualities.length === 0) return 'Excellent'
    
    const counts: Record<string, number> = {}
    let maxCount = 0
    let maxQuality = 'Excellent'
    for (const q of qualities) {
      counts[q] = (counts[q] || 0) + 1
      if (counts[q] > maxCount) {
        maxCount = counts[q]
        maxQuality = q
      }
    }
    return maxQuality
  }, [entries])

  const avgTime = React.useMemo(() => {
    const times = entries.map((e) => e.time_taken).filter((t) => t != null && t > 0) as number[]
    if (times.length === 0) return 27
    const sum = times.reduce((a, b) => a + b, 0)
    return Math.round(sum / times.length)
  }, [entries])

  const preferredMode = React.useMemo(() => {
    const modes = entries.map((e) => e.mode).filter(Boolean)
    if (modes.length === 0) return 'Standard'
    const counts: Record<string, number> = {}
    let maxCount = 0
    let maxMode = 'Standard'
    for (const m of modes) {
      counts[m] = (counts[m] || 0) + 1
      if (counts[m] > maxCount) {
        maxCount = counts[m]
        maxMode = m
      }
    }
    return maxMode.charAt(0).toUpperCase() + maxMode.slice(1)
  }, [entries])

  const activeUsed = usage?.used ?? entries.length ?? 14
  const activeLimit = usage?.limit ?? 20

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
        
        {/* WORKSPACE INSIGHTS sidebar card */}
        <div className="mx-4 my-3 p-3 bg-background border border-[#E3E5DE] rounded-lg text-left hidden md:block select-none shadow-2xs">
          <span className="text-[10px] font-bold text-[#5C6B63] uppercase tracking-wider block mb-2.5">
            WORKSPACE INSIGHTS
          </span>
          
          <div className="space-y-3 mb-3.5">
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileText className="h-3.5 w-3.5 text-muted-foreground/70" />
                <span>Documents</span>
              </div>
              <span className="font-bold text-foreground">{entries.length}</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-amber-500/80" />
                <span>Avg Quality</span>
              </div>
              <span className="font-bold text-foreground">{avgQuality}</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Zap className="h-3.5 w-3.5 text-muted-foreground/70" />
                <span>Avg Time</span>
              </div>
              <span className="font-bold text-foreground">{avgTime} sec</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Brain className="h-3.5 w-3.5 text-purple-500/80" />
                <span>Preferred Mode</span>
              </div>
              <span className="font-bold text-foreground">{preferredMode}</span>
            </div>
          </div>

          {/* Monthly Usage section */}
          <div className="border-t border-[#E3E5DE] pt-3">
            <span className="text-[10px] font-bold text-[#5C6B63] uppercase tracking-wider block mb-2">
              MONTHLY USAGE
            </span>
            <div className="h-1 w-full bg-[#EDF3EF] dark:bg-muted rounded-full overflow-hidden mb-1.5">
              <div 
                className="h-full bg-teal-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (activeUsed / activeLimit) * 100)}%` }}
              />
            </div>
            <span className="text-[10px] font-semibold text-muted-foreground block text-right">
              {activeUsed} of {activeLimit} Reports
            </span>
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
