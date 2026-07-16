import React from 'react'
import type { TaskItem } from '@/types/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash2, Plus, ChevronUp, ChevronDown, Play } from 'lucide-react'

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
  const handleUpdateTaskText = (index: number, newText: string) => {
    const updated = [...plan]
    updated[index] = { ...updated[index], task: newText }
    onChange(updated)
  }

  const handleDeleteTask = (index: number) => {
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

  return (
    <div className="flex flex-col gap-6 animate-[fadeIn_0.2s_ease-out]">
      <Card className="border-border shadow-sm text-left">
        <CardHeader className="border-b border-border pb-3 bg-muted/10 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
            Pipeline Execution Plan
          </CardTitle>
          <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20">
            {plan.length} Steps Outlined
          </Badge>
        </CardHeader>
        <CardContent className="pt-6 flex flex-col gap-3">
          {plan.map((item, idx) => (
            <div
              key={item.id || idx}
              className="flex items-center gap-3 p-3 border border-border rounded-lg bg-card shadow-sm hover:border-primary/20 transition-colors"
            >
              {/* Position Badge & Inline Label */}
              <Badge variant="outline" className="border-primary/20 text-primary select-none shrink-0">
                Step {idx + 1}
              </Badge>

              {/* Editable Input Field */}
              <input
                type="text"
                value={item.task}
                onChange={(e) => handleUpdateTaskText(idx, e.target.value)}
                className="flex-1 bg-transparent border-0 focus:ring-0 focus:border-0 p-0 text-xs font-semibold text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded px-1 -mx-1"
                placeholder="Describe task instruction..."
              />

              {/* Task Reordering Actions */}
              <div className="flex items-center gap-0.5 shrink-0 border-l border-border/80 pl-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleMoveTask(idx, 'up')}
                  disabled={idx === 0}
                  className="h-7 w-7 text-muted-foreground disabled:opacity-30 cursor-pointer"
                  aria-label="Move Up"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleMoveTask(idx, 'down')}
                  disabled={idx === plan.length - 1}
                  className="h-7 w-7 text-muted-foreground disabled:opacity-30 cursor-pointer"
                  aria-label="Move Down"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteTask(idx)}
                  className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/5 cursor-pointer ml-1"
                  aria-label="Delete Task"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {/* Add task outline item */}
          <Button
            variant="outline"
            onClick={handleAddTask}
            className="h-11 text-xs gap-2 border-dashed border-border hover:border-primary/40 text-muted-foreground hover:text-foreground w-full cursor-pointer mt-1"
          >
            <Plus className="h-4 w-4" /> Add Execution Task Step
          </Button>
        </CardContent>
      </Card>

      {/* Trigger Resume Execution Stream */}
      <div className="flex justify-end">
        <Button
          onClick={onResume}
          className="bg-primary text-primary-foreground font-semibold px-8 py-6 h-auto text-sm gap-2 cursor-pointer shadow-md hover:bg-primary/95 transition-all"
        >
          <Play className="h-4 w-4 fill-primary-foreground" /> Resume Execution Stream
        </Button>
      </div>
    </div>
  )
}
