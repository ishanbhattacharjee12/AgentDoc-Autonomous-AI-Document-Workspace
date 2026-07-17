import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  CheckCircle2, 
  TrendingUp, 
  Gavel, 
  Layers, 
  AlertTriangle, 
  Package, 
  Wrench, 
  ChevronDown, 
  ChevronUp, 
  GitBranch, 
  Check
} from 'lucide-react'

interface TaskCardProps {
  result: any
  planTask?: any
  isExpanded: boolean
  onToggle: () => void
}

export const TaskCard: React.FC<TaskCardProps> = ({ result, planTask, isExpanded, onToggle }) => {
  const taskId = result.task_id
  const taskTitle = result.task || planTask?.task || 'Execution Package'
  const toolName = result.tool || planTask?.tool || 'analysis'
  const executiveSummary = result.executive_summary || result.summary || 'Summary of phase execution and results.'
  const findings = result.key_findings || []
  const recommendations = result.recommendations || []
  const decisions = result.important_decisions || []
  const rationale = result.decision_rationale || 'Aligned with strategic priority matrix.'
  const assumptions = result.assumptions || []
  const risk = result.risks || ''
  const mitigation = result.mitigation || ''
  const tradeoff = result.tradeoffs || ''
  const deliverables = result.deliverables || []
  const confidence = result.task_confidence || 'High'

  const showRisks = risk && risk.trim() && risk !== 'Operational bandwidth limitations.'
  const showDeps = planTask?.depends_on && planTask.depends_on.length > 0

  return (
    <Card className="border-border shadow-xs overflow-hidden text-left bg-muted/5 transition-all">
      {/* Accordion Trigger Header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left hover:bg-muted/15 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
      >
        <div className="flex-1 min-w-0 flex items-start gap-3">
          {/* Completion Indicator */}
          <div className="mt-1 h-5 w-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0 shadow-3xs">
            <Check className="h-3 w-3 stroke-[3]" />
          </div>
          
          <div className="flex flex-col gap-1 min-w-0">
            {/* Primary Task Title Heading */}
            <h3 className="text-sm font-bold text-foreground leading-snug truncate">
              {taskTitle}
            </h3>
            {/* Secondary Metadata (Task ID, Confidence, Purpose) */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Task ID: #{taskId}
              </span>
              <span className="text-muted-foreground/40 font-light">•</span>
              <Badge variant="outline" className="border-primary/25 bg-primary/10 text-primary font-bold text-[9px] tracking-wider px-1.5 py-0">
                Confidence: {confidence}
              </Badge>
            </div>
            {/* Inline Purpose */}
            <p className="text-xs text-muted-foreground/90 line-clamp-1 mt-0.5">
              <strong className="text-foreground/75 font-semibold">Purpose:</strong> {planTask?.purpose || 'Aligned planning output execution'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground/80" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground/80" />
          )}
        </div>
      </button>

      {/* Accordion Expandable Content */}
      {isExpanded && (
        <div className="border-t border-border bg-card p-5 flex flex-col gap-5 animate-[fadeIn_0.15s_ease-out]">
          {/* Executive Summary */}
          <div className="text-xs text-muted-foreground leading-relaxed p-4 bg-background border border-border/80 rounded-lg border-l-4 border-l-[#2C6E5C]">
            <div className="font-bold text-foreground mb-1.5 flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-[#2C6E5C]" /> Executive Summary
            </div>
            <p className="whitespace-pre-line">{executiveSummary}</p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Key Findings */}
            <div className="bg-background p-4 rounded-lg border border-border/85 flex flex-col gap-2.5">
              <strong className="text-xs text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Key Findings
              </strong>
              {findings.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {findings.map((f: string, i: number) => (
                    <li key={i} className="text-xs text-muted-foreground flex gap-1.5 items-start leading-relaxed">
                      <Check className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs italic text-muted-foreground/60">No findings logged.</p>
              )}
            </div>

            {/* Recommendations */}
            <div className="bg-background p-4 rounded-lg border border-border/85 flex flex-col gap-2.5">
              <strong className="text-xs text-foreground flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-blue-600" /> Recommendations
              </strong>
              {recommendations.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {recommendations.map((r: string, i: number) => (
                    <li key={i} className="text-xs text-muted-foreground flex gap-1.5 items-start leading-relaxed">
                      <span className="text-blue-500 font-bold shrink-0 mt-0.5 select-none">→</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs italic text-muted-foreground/60">No recommendations logged.</p>
              )}
            </div>

            {/* Decisions */}
            <div className="bg-background p-4 rounded-lg border border-border/85 flex flex-col gap-2.5">
              <strong className="text-xs text-foreground flex items-center gap-1.5">
                <Gavel className="h-4 w-4 text-amber-600" /> Important Decisions
              </strong>
              {decisions.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {decisions.map((d: string, i: number) => (
                    <li key={i} className="text-xs text-muted-foreground flex gap-1.5 items-start leading-relaxed">
                      <span className="text-amber-500 font-semibold shrink-0 mt-0.5 select-none">?</span>
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs italic text-muted-foreground/60">No explicit decisions recorded.</p>
              )}
              <div className="text-[11px] text-muted-foreground/80 border-t border-border/50 pt-2 mt-1">
                <strong>Why:</strong> {rationale}
              </div>
            </div>

            {/* Assumptions */}
            <div className="bg-background p-4 rounded-lg border border-border/85 flex flex-col gap-2.5">
              <strong className="text-xs text-foreground flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-sky-600" /> Assumptions
              </strong>
              {assumptions.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {assumptions.map((a: string, i: number) => (
                    <li key={i} className="text-xs text-muted-foreground flex gap-1.5 items-start leading-relaxed">
                      <span className="text-sky-500 font-bold shrink-0 mt-0.5 select-none">•</span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs italic text-muted-foreground/60">No assumptions recorded.</p>
              )}
            </div>
          </div>

          {/* Risks if present */}
          {showRisks && (
            <div className="bg-rose-500/5 border border-rose-500/10 rounded-lg p-4 flex flex-col gap-2">
              <div className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-rose-500" /> Risks & Tradeoffs
              </div>
              <p className="text-xs text-muted-foreground">
                <strong>Primary Risk:</strong> {risk}
              </p>
              {mitigation && (
                <p className="text-xs text-muted-foreground">
                  <strong>Mitigation:</strong> {mitigation}
                </p>
              )}
              {tradeoff && (
                <p className="text-xs text-muted-foreground">
                  <strong>Tradeoff:</strong> {tradeoff}
                </p>
              )}
            </div>
          )}

          {/* Key Deliverables */}
          <div className="bg-background p-4 rounded-lg border border-border/85 flex flex-col gap-2.5">
            <strong className="text-xs text-foreground flex items-center gap-1.5">
              <Package className="h-4 w-4 text-[#2C6E5C]" /> Key Deliverables
            </strong>
            {deliverables.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {deliverables.map((d: string, i: number) => (
                  <li key={i} className="text-xs text-muted-foreground flex gap-1.5 items-start leading-relaxed">
                    <Check className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs italic text-muted-foreground/60">No deliverables generated.</p>
            )}
          </div>

          {/* Footer / Toggle Log Content */}
          <div className="flex justify-between items-center border-t border-border/70 pt-3 text-[11px] text-muted-foreground flex-wrap gap-3">
            <div className="flex gap-4 flex-wrap">
              <span className="flex items-center gap-1">
                <Wrench className="h-3.5 w-3.5 text-muted-foreground/70" /> 
                Tool: <strong className="text-primary">{toolName}</strong>
              </span>
              {showDeps && (
                <span className="flex items-center gap-1">
                  <GitBranch className="h-3.5 w-3.5 text-muted-foreground/70" /> 
                  Dependencies: <strong className="text-foreground">{planTask.depends_on.join(', ')}</strong>
                </span>
              )}
            </div>
          </div>
          
          {/* Expanded Output Logs (Mono layout) */}
          <div className="flex flex-col gap-2 mt-1">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
              Execution Output Logs
            </span>
            <pre className="p-4 border border-border bg-background rounded-lg font-mono text-[11px] text-muted-foreground leading-relaxed whitespace-pre-wrap overflow-x-auto max-h-[300px] overflow-y-auto text-left shadow-inner">
              {result.content || 'Detailed execution data logged inside complete document preview.'}
            </pre>
          </div>
        </div>
      )}
    </Card>
  )
}

export default TaskCard
