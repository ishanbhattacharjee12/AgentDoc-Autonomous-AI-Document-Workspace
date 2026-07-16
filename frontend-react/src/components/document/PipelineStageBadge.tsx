import React from 'react'
import { Check, Loader2, Circle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface PipelineStageBadgeProps {
  status: 'pending' | 'active' | 'completed'
  label: string
}

export const PipelineStageBadge: React.FC<PipelineStageBadgeProps> = ({ status, label }) => {
  if (status === 'completed') {
    return (
      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1.5 py-1 px-3">
        <Check className="h-3 w-3" /> {label}
      </Badge>
    )
  }

  if (status === 'active') {
    return (
      <Badge variant="default" className="bg-primary text-primary-foreground animate-pulse gap-1.5 py-1 px-3">
        <Loader2 className="h-3 w-3 animate-spin" /> {label}
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="bg-muted text-muted-foreground border-border gap-1.5 py-1 px-3">
      <Circle className="h-3 w-3 text-muted-foreground/50" /> {label}
    </Badge>
  )
}
