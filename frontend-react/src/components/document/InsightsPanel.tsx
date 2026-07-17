import React from 'react'
import type { GenerationResultData } from '@/types/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ShieldCheck, 
  Layers, 
  FileText, 
  Map, 
  ClipboardList, 
  CheckCircle2, 
  HelpCircle,
  Clock,
  Wrench,
  Sparkles,
  Info
} from 'lucide-react'

interface InsightsPanelProps {
  data: GenerationResultData
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({ data }) => {
  // 1. Confidence Color styling
  const getConfidenceStyle = (confidence?: string) => {
    const val = (confidence || 'medium').toLowerCase()
    if (val === 'high') {
      return {
        bg: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400',
        dot: 'bg-emerald-500'
      }
    }
    if (val === 'low') {
      return {
        bg: 'bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-400',
        dot: 'bg-rose-500'
      }
    }
    return {
      bg: 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400',
      dot: 'bg-amber-500'
    }
  }

  // 2. Complexity Color styling
  const getComplexityStyle = (complexity?: string) => {
    const val = (complexity || 'moderate').toLowerCase()
    if (val === 'simple') {
      return {
        bg: 'bg-sky-500/10 text-sky-700 border-sky-500/20 dark:text-sky-400',
        badge: 'Simple'
      }
    }
    if (val === 'complex') {
      return {
        bg: 'bg-violet-500/10 text-violet-700 border-violet-500/20 dark:text-violet-400',
        badge: 'Complex'
      }
    }
    return {
      bg: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20 dark:text-indigo-400',
      badge: 'Moderate'
    }
  }

  const confStyle = getConfidenceStyle(data.confidence)
  const compStyle = getComplexityStyle(data.complexity)

  return (
    <div className="flex flex-col gap-6 text-left animate-[fadeIn_0.15s_ease-out]">
      {/* Overview Metrics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Confidence Card */}
        <Card className="border-border shadow-sm h-full">
          <CardContent className="p-4 flex items-start gap-3 h-full">
            <div className="p-2 rounded-lg bg-muted/20 shrink-0 mt-0.5">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
              <div className="min-h-[28px] flex items-center">
                <span className="text-[9.5px] uppercase font-semibold text-muted-foreground tracking-wider block break-normal leading-tight">
                  Planner Confidence
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`h-2 w-2 rounded-full ${confStyle.dot}`} />
                <span className="text-sm font-bold text-foreground capitalize">
                  {data.confidence || 'Medium'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Complexity Card */}
        <Card className="border-border shadow-sm h-full">
          <CardContent className="p-4 flex items-start gap-3 h-full">
            <div className="p-2 rounded-lg bg-muted/20 shrink-0 mt-0.5">
              <Layers className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
              <div className="min-h-[28px] flex items-center">
                <span className="text-[9.5px] uppercase font-semibold text-muted-foreground tracking-wider block break-normal leading-tight">
                  Task Complexity
                </span>
              </div>
              <div className="text-sm font-bold text-foreground block mt-1">
                {compStyle.badge}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estimated Reading Time */}
        <Card className="border-border shadow-sm h-full">
          <CardContent className="p-4 flex items-start gap-3 h-full">
            <div className="p-2 rounded-lg bg-muted/20 shrink-0 mt-0.5">
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
              <div className="min-h-[28px] flex items-center">
                <span className="text-[9.5px] uppercase font-semibold text-muted-foreground tracking-wider block break-normal leading-tight">
                  Estimated Reading Time
                </span>
              </div>
              <div className="text-sm font-bold text-foreground block mt-1">
                {data.reading_time || '5 mins'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Implementation Effort */}
        <Card className="border-border shadow-sm h-full">
          <CardContent className="p-4 flex items-start gap-3 h-full">
            <div className="p-2 rounded-lg bg-muted/20 shrink-0 mt-0.5">
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
              <div className="min-h-[28px] flex items-center">
                <span className="text-[9.5px] uppercase font-semibold text-muted-foreground tracking-wider block break-normal leading-tight">
                  Effort Level
                </span>
              </div>
              <div className="text-sm font-bold text-foreground block mt-1">
                {data.implementation_effort || 'Moderate'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column: Intent, Strategy & Logic */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {/* Card 1: Intent & Document Strategy */}
          <Card className="border-border shadow-sm">
            <CardHeader className="border-b border-border pb-3 bg-muted/10">
              <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" /> Document Plan & Objectives
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 flex flex-col gap-4">
              {/* Document Type badge */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">Document Type Resolved:</span>
                <Badge variant="outline" className="border-primary/20 text-primary uppercase font-bold text-[10px] tracking-wider px-2 py-0.5">
                  {(data.document_type || 'business_document').replace('_', ' ')}
                </Badge>
              </div>

              {/* Goal statement */}
              {data.goal && (
                <div className="bg-muted/5 border border-border/60 p-3 rounded-lg">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-primary" /> Target Document Objective
                  </div>
                  <p className="text-xs text-foreground font-medium leading-relaxed">
                    {data.goal}
                  </p>
                </div>
              )}

              {/* Reasoning Summary */}
              {data.planning_summary && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">Planner Contextual Strategy:</span>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {data.planning_summary}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 2: Execution Strategy */}
          <Card className="border-border shadow-sm">
            <CardHeader className="border-b border-border pb-3 bg-muted/10">
              <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                <Map className="h-4 w-4 text-muted-foreground" /> Routing & Execution Strategy
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 flex flex-col gap-4">
              {/* Routing Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-semibold text-muted-foreground">Resolution Mode</span>
                  <span className="text-xs font-bold text-foreground capitalize">
                    {data.routing_outcome || 'Advanced Mode'}
                  </span>
                </div>
                {data.confidence_reason && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-semibold text-muted-foreground">Confidence Rationale</span>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {data.confidence_reason}
                    </p>
                  </div>
                )}
                {data.complexity_reason && (
                  <div className="flex flex-col gap-1 md:col-span-2 border-t border-border/40 pt-3">
                    <span className="text-[11px] font-semibold text-muted-foreground">Complexity Assessment</span>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {data.complexity_reason}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Assumptions & Self-Check Reflection */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Card 3: Assumptions */}
          <Card className="border-border shadow-sm">
            <CardHeader className="border-b border-border pb-3 bg-muted/10">
              <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-muted-foreground" /> Planner Assumptions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 flex flex-col gap-3">
              {data.assumptions && data.assumptions.length > 0 ? (
                <ul className="flex flex-col gap-2.5">
                  {data.assumptions.map((item, idx) => (
                    <li key={idx} className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
                      <span className="text-primary font-bold shrink-0 select-none">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-6 text-muted-foreground/60">
                  <HelpCircle className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-xs italic">No explicit assumptions were formulated during planning.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 4: Reflection Self-Check */}
          {data.reflection && (
            <Card className="border-border shadow-sm">
              <CardHeader className="border-b border-border pb-3 bg-muted/10">
                <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" /> Validation Self-Check
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 flex flex-col gap-4">
                {/* Score & Passed status */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">Quality Audit Grade:</span>
                  <Badge className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    data.reflection.passed 
                      ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 dark:text-emerald-400' 
                      : 'bg-rose-500/10 text-rose-700 border border-rose-500/20 dark:text-rose-400'
                  }`}>
                    {data.reflection.grade || (data.reflection.passed ? 'Excellent' : 'Needs Work')}
                  </Badge>
                </div>

                {/* Audit reasoning */}
                {data.reflection.reason && (
                  <p className="text-xs text-muted-foreground leading-relaxed border-t border-border/40 pt-3">
                    {data.reflection.reason}
                  </p>
                )}

                {/* Improvements list */}
                {data.reflection.improvements_applied && data.reflection.improvements_applied.length > 0 && (
                  <div className="flex flex-col gap-2 border-t border-border/40 pt-3">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <Info className="h-3.5 w-3.5 text-blue-500" /> Improvements Applied
                    </span>
                    <ul className="flex flex-col gap-1.5 pl-2">
                      {data.reflection.improvements_applied.map((imp, i) => (
                        <li key={i} className="text-xs text-muted-foreground leading-normal flex gap-1.5 items-start">
                          <span className="text-emerald-500 font-semibold shrink-0 select-none">✓</span>
                          <span>{imp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default InsightsPanel
