import React from 'react'
import { Button } from '@/components/ui/button'
import { X, RefreshCw } from 'lucide-react'

interface StreamToolbarProps {
  onCancel?: () => void
  cancelLabel?: string
  onReset?: () => void
  resetLabel?: string
  className?: string
}

export const StreamToolbar: React.FC<StreamToolbarProps> = ({
  onCancel,
  cancelLabel = 'Cancel Process',
  onReset,
  resetLabel = 'Generate New',
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-end gap-3 ${className}`}>
      {onCancel && (
        <Button
          onClick={onCancel}
          variant="outline"
          size="sm"
          className="gap-2 border-destructive/20 text-destructive hover:bg-destructive/5"
        >
          <X className="h-4 w-4" /> {cancelLabel}
        </Button>
      )}
      {onReset && (
        <Button
          onClick={onReset}
          variant="outline"
          size="sm"
          className="gap-2 border-border text-muted-foreground hover:bg-muted/5"
        >
          <RefreshCw className="h-4 w-4" /> {resetLabel}
        </Button>
      )}
    </div>
  )
}
export default StreamToolbar
