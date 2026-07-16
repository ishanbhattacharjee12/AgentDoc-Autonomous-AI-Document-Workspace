import React from 'react'
import type { GenerationResultData } from '@/types/api'

interface GenerationSummaryProps {
  data: GenerationResultData
}

export const GenerationSummary: React.FC<GenerationSummaryProps> = ({ data }) => {
  const metrics = [
    { label: 'Active Model', value: data.active_model || 'hy3-free', class: 'font-mono' },
    { label: 'LLM Provider', value: data.provider || 'OpenCode Zen' },
    { label: 'Tokens Consumed', value: data.llm_tokens_used != null ? `${data.llm_tokens_used} tokens` : '—' },
    { label: 'LLM Call Count', value: data.llm_call_count != null ? `${data.llm_call_count} calls` : '—' },
    { label: 'Total Duration', value: data.time_taken != null ? `${data.time_taken.toFixed(1)}s` : '—' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 p-4 border border-border rounded-lg bg-card shadow-sm text-left">
      {metrics.map((m, idx) => (
        <div key={idx} className="flex flex-col gap-1 border-r border-border last:border-r-0 pr-2">
          <span className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">{m.label}</span>
          <span className={`text-xs font-semibold text-foreground truncate ${m.class || ''}`}>{m.value}</span>
        </div>
      ))}
    </div>
  )
}
export default GenerationSummary
