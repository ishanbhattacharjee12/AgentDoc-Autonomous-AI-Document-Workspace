import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Sparkles, SlidersHorizontal, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'

export const GeneratePage: React.FC = () => {
  const [requestText, setRequestText] = useState('')
  const [format, setFormat] = useState('pdf')
  const [mode, setMode] = useState('standard')
  const [requireReview, setRequireReview] = useState(false)
  const [ignoreCache, setIgnoreCache] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const demo1 =
    'Create a project plan for launching an AI-powered customer support chatbot for a mid-sized e-commerce company. Include objectives, scope, phases, timeline, team responsibilities, risks, success metrics, and next steps.'
  const demo2 =
    "We need to improve customer onboarding because users are dropping off, but we don't know exactly where. Create a practical improvement plan that can be presented to leadership. We want results quickly, the budget is limited, and engineering capacity is small. Decide what should be investigated first, make reasonable assumptions where information is missing, prioritize actions, define success metrics, risks, and a phased 90-day plan."

  const handleRunAgent = (e: React.FormEvent) => {
    e.preventDefault()
    if (!requestText.trim()) return
    console.log('Running agent with params:', {
      requestText,
      format,
      mode,
      requireReview,
      ignoreCache,
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Generate Document</h1>
        <p className="text-sm text-muted-foreground mt-1">Specify your document goals, and the pipeline agent will outline, structure, and synthesize it.</p>
      </div>

      <form onSubmit={handleRunAgent} className="flex flex-col gap-6">
        {/* Main Input Textarea */}
        <Card className="border-border">
          <CardContent className="pt-6 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="prompt-input" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Document Request Prompt
              </label>
              <textarea
                id="prompt-input"
                rows={5}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 min-h-[120px] resize-y"
                placeholder="Describe the document you need generated (e.g. scope, audience, constraints, success criteria)..."
                value={requestText}
                onChange={(e) => setRequestText(e.target.value)}
              />
            </div>

            {/* Quick Demos */}
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground mr-1">Demo Prompts:</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRequestText(demo1)}
                className="text-xs py-1 h-8 text-primary border-primary/20 hover:bg-accent/5"
              >
                Project Plan Chatbot
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRequestText(demo2)}
                className="text-xs py-1 h-8 text-primary border-primary/20 hover:bg-accent/5"
              >
                Customer Onboarding Improvement
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pipeline options bar */}
        <Card className="border-border">
          <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {/* Format Selection */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Output Format
              </label>
              <Select value={format} onValueChange={(val) => setFormat(val || 'pdf')}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Document</SelectItem>
                  <SelectItem value="docx">Word Document (.docx)</SelectItem>
                  <SelectItem value="md">Markdown File (.md)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Pipeline Mode Selection */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Execution Mode
              </label>
              <Select value={mode} onValueChange={(val) => setMode(val || 'standard')}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard Mode (Linear)</SelectItem>
                  <SelectItem value="advanced">Advanced Mode (Reflection)</SelectItem>
                  <SelectItem value="adaptive">Adaptive Mode (Automatic)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Plan review toggle */}
            <div className="flex items-center justify-between sm:justify-start gap-6 pt-2 sm:pt-0">
              <div className="flex flex-col text-left">
                <span className="text-sm font-semibold text-foreground">Require Review</span>
                <span className="text-[11px] text-muted-foreground">Approve plan before generation</span>
              </div>
              <Switch checked={requireReview} onCheckedChange={setRequireReview} />
            </div>
          </CardContent>
        </Card>

        {/* Advanced Settings Collapsible */}
        <Card className="border-border">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between px-6 py-4 text-left border-none bg-transparent hover:bg-muted/5 transition-colors focus:outline-none"
          >
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Advanced Options & Diagnostics</span>
            </div>
            {showAdvanced ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>
          
          {showAdvanced && (
            <CardContent className="px-6 pb-6 border-t border-border pt-6 flex flex-col gap-6 animate-[fadeIn_0.2s_ease-out]">
              {/* Bypass cache toggle */}
              <div className="flex items-center justify-between max-w-md">
                <div className="flex flex-col text-left">
                  <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    Ignore Request Cache <AlertTriangle className="h-3.5 w-3.5 text-destructive inline" />
                  </span>
                  <span className="text-[11px] text-muted-foreground">Force pipeline to execute full LLM stages</span>
                </div>
                <Switch checked={ignoreCache} onCheckedChange={setIgnoreCache} />
              </div>

              {/* Developer stats panel placeholder */}
              <div className="bg-muted/30 border border-border rounded-lg p-4 flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">Active model</span>
                  <span className="text-xs font-mono font-medium text-foreground">hy3-free</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">Registry Profile</span>
                  <span className="text-xs font-mono font-medium text-foreground">Standard (Fast/Reflect)</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">Cache Status</span>
                  <span className="text-xs font-mono font-medium text-foreground">Initialized</span>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Generate Trigger Button */}
        <div className="flex justify-end mt-2">
          <Button
            type="submit"
            disabled={!requestText.trim()}
            className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-8 py-6 h-auto text-sm gap-2"
          >
            <Sparkles className="h-4 w-4" /> Run Agent Pipeline
          </Button>
        </div>
      </form>
    </div>
  )
}
export default GeneratePage
