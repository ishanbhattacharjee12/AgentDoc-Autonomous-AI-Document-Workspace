import React from 'react'
import { PipelineStageBadge } from './PipelineStageBadge'

interface StageTrackerProps {
  currentStage: string
}

const STAGES = [
  { key: 'planning', label: 'Planning' },
  { key: 'executing', label: 'Executing' },
  { key: 'synthesizing', label: 'Synthesizing' },
  { key: 'reflecting', label: 'Reflecting' },
  { key: 'generating', label: 'Generating Document' },
]

export const StageTracker: React.FC<StageTrackerProps> = ({ currentStage }) => {
  const normalizedStage = currentStage.toLowerCase()

  const getStageStatus = (index: number) => {
    // Determine active index
    let activeIndex = 0
    if (normalizedStage.includes('plan')) activeIndex = 0
    else if (normalizedStage.includes('execut')) activeIndex = 1
    else if (normalizedStage.includes('synth')) activeIndex = 2
    else if (normalizedStage.includes('reflect')) activeIndex = 3
    else if (normalizedStage.includes('document') || normalizedStage.includes('pdf') || normalizedStage.includes('generat')) activeIndex = 4

    if (activeIndex === index) return 'active'
    if (activeIndex > index) return 'completed'
    return 'pending'
  }

  return (
    <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border border-border rounded-lg bg-card shadow-sm">
      <div className="flex flex-col text-left">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pipeline Flow Status</span>
        <span className="text-sm font-bold text-foreground mt-0.5">Autonomous Document Agent</span>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {STAGES.map((stage, idx) => (
          <React.Fragment key={stage.key}>
            <PipelineStageBadge
              status={getStageStatus(idx)}
              label={stage.label}
            />
            {idx < STAGES.length - 1 && (
              <div className="hidden lg:block h-px w-6 bg-border" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}
