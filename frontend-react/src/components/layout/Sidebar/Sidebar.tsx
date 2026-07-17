import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Sparkles, Clock, Settings, Menu, X, FileText } from 'lucide-react'

export const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)

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
        
        {/* Quick Tips reference card */}
        <div className="mx-4 my-3 p-3 bg-muted/30 border border-border/50 rounded-lg text-left hidden md:block select-none">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
            Quick Tips & Keys
          </span>
          <div className="space-y-2 text-[11px] text-muted-foreground">
            <div className="flex justify-between items-center">
              <span>Command Palette</span>
              <kbd className="px-1.5 py-0.5 rounded bg-background border border-border/80 font-mono text-[9px] shadow-2xs font-semibold text-foreground/80">⌘/Ctrl K</kbd>
            </div>
            <div className="flex justify-between items-center">
              <span>Run / Resume</span>
              <kbd className="px-1.5 py-0.5 rounded bg-background border border-border/80 font-mono text-[9px] shadow-2xs font-semibold text-foreground/80">⌘/Ctrl ↵</kbd>
            </div>
            <div className="flex justify-between items-center">
              <span>New Document</span>
              <kbd className="px-1.5 py-0.5 rounded bg-background border border-border/80 font-mono text-[9px] shadow-2xs font-semibold text-foreground/80">⌘/Ctrl ⇧N</kbd>
            </div>
            <div className="flex justify-between items-center">
              <span>Download PDF</span>
              <kbd className="px-1.5 py-0.5 rounded bg-background border border-border/80 font-mono text-[9px] shadow-2xs font-semibold text-foreground/80">⌘/Ctrl S</kbd>
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
