import React from 'react'
import type { GenerationResultData } from '@/types/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Cpu, Server, Coins, Zap, Activity } from 'lucide-react'

interface GenerationSummaryProps {
  data: GenerationResultData
}

export const GenerationSummary: React.FC<GenerationSummaryProps> = ({ data }) => {
  const metrics = [
    { label: 'Active Model', value: data.active_model || 'hy3-free', icon: Cpu, class: 'font-mono' },
    { label: 'LLM Provider', value: data.provider || 'OpenCode Zen', icon: Server },
    { label: 'Tokens Consumed', value: data.llm_tokens_used != null ? `${data.llm_tokens_used.toLocaleString()} tokens` : '—', icon: Coins },
    { label: 'LLM Call Count', value: data.llm_call_count != null ? `${data.llm_call_count} calls` : '—', icon: Activity },
    { label: 'Total Duration', value: data.time_taken != null ? `${data.time_taken.toFixed(1)}s` : '—', icon: Zap },
  ]

  return (
    <Card className="border-border shadow-sm text-left">
      <CardHeader className="border-b border-border pb-3 bg-muted/10">
        <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
          Generation Details
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 flex flex-col gap-3.5">
        {metrics.map((m, idx) => {
          const Icon = m.icon
          return (
            <div key={idx} className="flex items-center justify-between gap-4 border-b border-border/60 last:border-b-0 pb-3 last:pb-0">
              <div className="flex items-center gap-2">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{m.label}</span>
              </div>
              <span className={`text-xs font-semibold text-foreground ${m.class || ''}`}>{m.value}</span>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
export default GenerationSummary
