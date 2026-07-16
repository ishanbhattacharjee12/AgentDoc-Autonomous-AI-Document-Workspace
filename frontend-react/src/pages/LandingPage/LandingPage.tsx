import React from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles,
  Clock,
  ArrowRight,
  Cpu,
  FileText,
  ShieldCheck,
  Search,
  Layers,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'

export const LandingPage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen text-foreground selection:bg-primary/10 select-none">
      {/* 1. Header Navigation */}
      <header className="border-b border-border bg-background/50 backdrop-blur sticky top-0 z-40 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8.5 w-8.5 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <FileText className="h-5 w-5" />
          </div>
          <span className="font-bold text-foreground tracking-tight text-base leading-none">AgentDoc</span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            GitHub <ExternalLink className="h-3 w-3" />
          </a>
          <Link
            to="/generate"
            className="bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold px-4 py-2 rounded-lg shadow transition-colors flex items-center gap-1"
          >
            Launch Workspace <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-28 md:pb-24 border-b border-border bg-muted/5">
        <div className="mx-auto max-w-[800px] text-center px-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-background text-[11px] font-semibold text-primary tracking-wide uppercase mb-6 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" /> Introducing AgentDoc v1.0
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-[1.1] mb-6">
            Autonomous Document Workspace for Enterprise Pipelines
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-[620px] mx-auto leading-relaxed mb-10">
            Synthesize editorial-grade PDF documents from raw prompts. Features multi-agent planning pipelines, human-in-the-loop outline reviews, and detailed self-check reflections.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/generate"
              className="w-full sm:w-auto bg-primary hover:bg-primary/95 text-primary-foreground text-sm font-semibold px-8 py-3.5 rounded-lg shadow-md transition-colors flex items-center justify-center gap-2"
            >
              Launch Document Workspace <ArrowRight className="h-4.5 w-4.5" />
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto bg-background hover:bg-muted/30 border border-border text-foreground text-sm font-semibold px-8 py-3.5 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              View Repository Code <ExternalLink className="h-4.5 w-4.5" />
            </a>
          </div>
        </div>
      </section>

      {/* 3. Features Section */}
      <section className="py-16 md:py-24 border-b border-border px-6">
        <div className="mx-auto max-w-[960px]">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Core Capabilities
            </h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-[480px] mx-auto">
              A comprehensive workspace optimized for editorial precision and runtime predictability.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Cpu,
                title: 'AI Planning Pipeline',
                desc: 'Agents automatically decompose requests into task checklists, selecting styles, scopes, and structures.',
              },
              {
                icon: Layers,
                title: 'Human-in-the-Loop Reviews',
                desc: 'Pause execution to inspect, edit, add, or delete outline steps in real time before synthesis begins.',
              },
              {
                icon: ShieldCheck,
                title: 'Explainability & Insights',
                desc: 'Review planner assumptions, confidence ratings, and self-check reflection audits for zero internal black-box opacity.',
              },
              {
                icon: FileText,
                title: 'Editorial PDF Rendering',
                desc: 'Vellum & Ink page typesetting featuring proportional grids, tables, clean cover layouts, and headers.',
              },
              {
                icon: Clock,
                title: 'Document Library',
                desc: 'Notion-style library lists. Double-click to rename, star favorites, duplicate entries, or browse drafts in sidebar drawers.',
              },
              {
                icon: Search,
                title: 'Ctrl+K Command Palette',
                desc: 'Fuzzy search, execute navigation hooks, run pipelines, start custom drafts, and trigger downloads using accessibility keyboard layers.',
              },
            ].map((feat, idx) => {
              const Icon = feat.icon
              return (
                <div key={idx} className="bg-card border border-border hover:border-border/120 rounded-xl p-6 text-left shadow-sm hover:shadow transition-all">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-primary mb-4 shrink-0 shadow-inner">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground mb-2">{feat.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{feat.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 4. Workflow Section */}
      <section className="py-16 md:py-24 border-b border-border bg-muted/5 px-6">
        <div className="mx-auto max-w-[960px] text-center">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-12">
            Execution Flow Sequence
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-3 max-w-[800px] mx-auto">
            {[
              'Prompt',
              'Planning',
              'Review',
              'Execution',
              'Reflection',
              'Document',
              'History',
              'Export',
            ].map((step, idx, arr) => (
              <React.Fragment key={idx}>
                <div className="bg-background border border-border px-5 py-3 rounded-lg shadow-sm font-semibold text-xs text-foreground flex items-center gap-1.5 min-w-[100px] justify-center">
                  <span className="text-[10px] text-muted-foreground/60 font-mono">0{idx + 1}</span>
                  {step}
                </div>
                {idx < arr.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground/45 shrink-0 hidden md:block" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Tech Stack Section */}
      <section className="py-16 md:py-24 border-b border-border px-6">
        <div className="mx-auto max-w-[960px] text-center">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-12">
            Platform Technology Stack
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-[860px] mx-auto">
            {[
              { title: 'React 19 & TypeScript', desc: 'Component architecture, strict safety, and performance' },
              { title: 'Tailwind CSS & shadcn/ui', desc: 'Clean, modern typography and cool paper layout styling' },
              { title: 'FastAPI & Pydantic', desc: 'High-performance API contracts and Python multi-agent pipeline' },
              { title: 'SQLite & IndexedDB', desc: 'Persistent request caching and secure client library storage' },
            ].map((tech, idx) => (
              <div key={idx} className="bg-card border border-border p-5 rounded-lg text-left shadow-sm">
                <div className="h-1.5 w-8 bg-primary rounded mb-3" />
                <h4 className="text-xs font-bold text-foreground">{tech.title}</h4>
                <p className="text-[10px] text-muted-foreground mt-1 leading-normal">{tech.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="border-t border-border bg-background py-10 px-6 text-xs text-muted-foreground mt-auto">
        <div className="mx-auto max-w-[960px] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground">
              <FileText className="h-3.5 w-3.5" />
            </div>
            <span className="font-semibold text-foreground">AgentDoc v1.0</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <span>Author: Ishan Bhattacharjee</span>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
              GitHub Repository
            </a>
            <span>License: MIT</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
