import { AlertCircle, WifiOff, Clock, ShieldAlert } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from './button'

export type ErrorType = 'network' | 'timeout' | 'stream-drop' | 'generation-fail' | 'export-fail' | 'general'

interface ErrorStateProps {
  type?: ErrorType
  title?: string
  message: string
  onRetry?: () => void
  retryLabel?: string
  onCancel?: () => void
  cancelLabel?: string
  className?: string
  children?: React.ReactNode // To preserve and show content preview if needed
}

const ERROR_CONFIGS: Record<ErrorType, { title: string; icon: LucideIcon; bgClass: string; textClass: string }> = {
  network: {
    title: 'Network Error',
    icon: WifiOff,
    bgClass: 'bg-destructive/10',
    textClass: 'text-destructive',
  },
  timeout: {
    title: 'Pipeline Timeout',
    icon: Clock,
    bgClass: 'bg-warning/10',
    textClass: 'text-warning-foreground',
  },
  'stream-drop': {
    title: 'Connection Lost',
    icon: WifiOff,
    bgClass: 'bg-destructive/10',
    textClass: 'text-destructive',
  },
  'generation-fail': {
    title: 'Generation Failed',
    icon: ShieldAlert,
    bgClass: 'bg-destructive/10',
    textClass: 'text-destructive',
  },
  'export-fail': {
    title: 'Export Failed',
    icon: AlertCircle,
    bgClass: 'bg-warning/10',
    textClass: 'text-warning-foreground',
  },
  general: {
    title: 'An Error Occred',
    icon: AlertCircle,
    bgClass: 'bg-destructive/10',
    textClass: 'text-destructive',
  },
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  type = 'general',
  title,
  message,
  onRetry,
  retryLabel = 'Retry',
  onCancel,
  cancelLabel = 'Cancel',
  className = '',
  children,
}) => {
  const config = ERROR_CONFIGS[type]
  const Icon = config.icon
  const displayTitle = title || config.title

  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto">
      <div className={`flex flex-col items-center justify-center text-center p-8 border border-border rounded-lg bg-card ${className}`}>
        <div className={`flex h-12 w-12 items-center justify-center rounded-full ${config.bgClass} ${config.textClass} mb-4`}>
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">{displayTitle}</h3>
        <p className="text-sm text-muted-foreground max-w-md mb-6">{message}</p>
        
        {(onRetry || onCancel) && (
          <div className="flex flex-row items-center gap-3">
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                {cancelLabel}
              </Button>
            )}
            {onRetry && (
              <Button variant="default" onClick={onRetry} className="bg-primary hover:bg-primary/95 text-primary-foreground">
                {retryLabel}
              </Button>
            )}
          </div>
        )}
      </div>
      
      {/* If children are passed (e.g. preview content to preserve), render them below */}
      {children && (
        <div className="border border-border rounded-lg p-4 bg-muted/30">
          <h4 className="text-sm font-semibold text-muted-foreground mb-3">Recovered Content Preview</h4>
          {children}
        </div>
      )}
    </div>
  )
}
