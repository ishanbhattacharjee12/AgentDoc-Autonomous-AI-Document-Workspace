import React from 'react'
import { Loader2 } from 'lucide-react'

interface LoadingStateProps {
  title?: string
  description?: string
  className?: string
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  title = 'Loading...',
  description,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 ${className}`}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/5 mb-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      {description && <p className="text-xs text-muted-foreground mt-1 max-w-xs">{description}</p>}
    </div>
  )
}
