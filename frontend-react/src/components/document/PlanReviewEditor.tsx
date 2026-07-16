import React, { useRef, useEffect } from 'react'
import type { TaskItem } from '@/types/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash2, Plus, ChevronUp, ChevronDown, Play, GripVertical } from 'lucide-react'

interface PlanReviewEditorProps {
  plan: TaskItem[]
  onChange: (updatedPlan: TaskItem[]) => void
  onResume: () => void
}

export const PlanReviewEditor: React.FC<PlanReviewEditorProps> = ({
  plan,
  onChange,
  onResume,
}) => {
  const lastAddedRef = useRef<HTMLInputElement | null>(null)
  const justAddedRef = useRef(false)

  // Auto-focus newly added task input
  useEffect(() => {
    if (justAddedRef.current && lastAddedRef.current) {
      lastAddedRef.current.focus()
      lastAddedRef.current.select()
      justAddedRef.current = false
    }
  }, [plan.length])

  const handleUpdateTaskText = (index: number, newText: string) => {
    const updated = [...plan]
    updated[index] = { ...updated[index], task: newText }
    onChange(updated)
  }

  const handleDeleteTask = (index: number) => {
    if (plan.length <= 1) return // Guard: require at least 1 step
    const updated = plan.filter((_, idx) => idx !== index)
    onChange(updated)
  }

  const handleAddTask = () => {
    const maxId = plan.length > 0 
      ? Math.max(...plan.map(t => typeof t.id === 'number' ? t.id : parseInt(String(t.id), 10) || 0)) 
      : 0
    const newId = String(maxId + 1)
    
    const newTask: TaskItem = {
      id: newId,
      task: 'New custom analysis task step',
      status: 'pending',
      depends_on: [],
    }
    justAddedRef.current = true
    onChange([...plan, newTask])
  }

  const handleMoveTask = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === plan.length - 1) return

    const targetIndex = direction === 'up' ? index - 1 : index + 1
    const updated = [...plan]
    const temp = updated[index]
    updated[index] = updated[targetIndex]
    updated[targetIndex] = temp
    onChange(updated)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      ;(e.target as HTMLInputElement).blur()
    }
    if (e.key === 'Escape') {
      ;(e.target as HTMLInputElement).blur()
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-[fadeIn_0.2s_ease-out]">
      <Card className="border-border shadow-sm text-left">
        <CardHeader className="border-b border-border pb-3 bg-muted/10 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
            Pipeline Execution Plan
          </CardTitle>
          <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20">
            {plan.length} {plan.length === 1 ? 'Step' : 'Steps'} Outlined
          </Badge>
        </CardHeader>
        <CardContent className="pt-5 flex flex-col gap-2">
          {plan.length === 0 && (
            <div className="text-center py-10 text-muted-foreground text-sm">
              No execution steps defined. Add at least one step to continue.
            </div>
          )}

          {plan.map((item, idx) => (
            <div
              key={item.id || idx}
              className="group flex items-center gap-3 px-3 py-2.5 border border-border rounded-lg bg-card hover:border-primary/25 hover:shadow-sm transition-all"
            >
              {/* Grip handle (visual only) */}
              <GripVertical className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors shrink-0 cursor-grab" />

              {/* Step badge */}
              <Badge variant="outline" className="border-primary/20 text-primary select-none shrink-0 tabular-nums text-[11px] px-2 py-0.5">
                Step {idx + 1}
              </Badge>

              {/* Editable input — styled to look like text when unfocused */}
              <input
                ref={idx === plan.length - 1 ? lastAddedRef : null}
                type="text"
                value={item.task}
                onChange={(e) => handleUpdateTaskText(idx, e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent border-0 focus:ring-0 focus:border-0 p-0 text-[13px] font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:bg-muted/30 rounded px-2 py-1 -mx-1 transition-colors"
                placeholder="Describe task instruction..."
                aria-label={`Edit step ${idx + 1}`}
              />

              {/* Reorder & delete actions — visible on hover, always accessible */}
              <div className="flex items-center gap-0.5 shrink-0 border-l border-border/60 pl-2 opacity-50 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleMoveTask(idx, 'up')}
                  disabled={idx === 0}
                  className="h-7 w-7 text-muted-foreground disabled:opacity-20 cursor-pointer"
                  aria-label={`Move step ${idx + 1} up`}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleMoveTask(idx, 'down')}
                  disabled={idx === plan.length - 1}
                  className="h-7 w-7 text-muted-foreground disabled:opacity-20 cursor-pointer"
                  aria-label={`Move step ${idx + 1} down`}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteTask(idx)}
                  disabled={plan.length <= 1}
                  className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/5 disabled:opacity-20 disabled:hover:text-muted-foreground disabled:hover:bg-transparent cursor-pointer ml-0.5"
                  aria-label={`Delete step ${idx + 1}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}

          {/* Add step — dashed outline button */}
          <Button
            variant="outline"
            onClick={handleAddTask}
            className="h-10 text-xs gap-2 border-dashed border-border hover:border-primary/40 text-muted-foreground hover:text-foreground w-full cursor-pointer mt-1"
          >
            <Plus className="h-4 w-4" /> Add Execution Task Step
          </Button>
        </CardContent>
      </Card>

      {/* Resume button — right-aligned, prominent */}
      <div className="flex justify-end">
        <Button
          onClick={onResume}
          disabled={plan.length === 0}
          className="bg-primary text-primary-foreground font-semibold px-8 py-6 h-auto text-sm gap-2 cursor-pointer shadow-md hover:bg-primary/95 transition-all disabled:opacity-50"
        >
          <Play className="h-4 w-4 fill-primary-foreground" /> Resume Execution Stream
        </Button>
      </div>
    </div>
  )
}
