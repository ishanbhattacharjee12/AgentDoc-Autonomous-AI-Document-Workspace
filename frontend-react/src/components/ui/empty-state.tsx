import React from 'react'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  title: string
  description: string
  icon?: LucideIcon
  action?: React.ReactNode
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon,
  action,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 border border-dashed border-border rounded-lg bg-card ${className}`}>
      {Icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent-foreground mb-4">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
      {action && <div className="flex items-center justify-center">{action}</div>}
    </div>
  )
}
