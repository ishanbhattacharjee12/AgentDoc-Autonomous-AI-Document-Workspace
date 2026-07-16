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
        className={`fixed inset-y-0 left-0 z-20 flex w-[260px] flex-col border-r border-border bg-card transition-transform duration-300 md:sticky md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo Section */}
        <div className="hidden md:flex h-[64px] items-center gap-2.5 px-6 border-b border-border">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FileText className="h-5.5 w-5.5" />
          </div>
          <div>
            <span className="font-bold text-foreground tracking-tight text-lg block leading-none">AgentDoc</span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5 block">Document Pipeline</span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 space-y-1.5 p-4 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 group border border-transparent ${
                    isActive
                      ? 'bg-accent/10 border-accent/20 text-accent-foreground font-medium'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`
                }
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

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border bg-muted/20">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-semibold text-sm">
              AD
            </div>
            <div className="flex flex-col text-left overflow-hidden">
              <span className="text-xs font-semibold text-foreground truncate">AgentDoc Client</span>
              <span className="text-[10px] text-muted-foreground truncate">v2.0 Beta</span>
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
