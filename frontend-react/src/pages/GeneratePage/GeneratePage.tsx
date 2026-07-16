import React, { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { ErrorState } from '@/components/ui/error-state'
import type { ErrorType } from '@/components/ui/error-state'
import { SectionHeader } from '@/components/ui/section-header'
import { Badge } from '@/components/ui/badge'
import { streamGeneration, getDocumentDownloadUrl, streamPlanExecution } from '@/services/api'
import { useStreamingBuffer } from '@/hooks/useStreamingBuffer'
import type { DocumentFormat, ExecutionMode, GenerationResultData, PlanReviewData, TaskItem } from '@/types/api'
import { Sparkles, SlidersHorizontal, AlertTriangle, ChevronDown, ChevronUp, Download, FileText, RefreshCw } from 'lucide-react'

import { StageTracker } from '@/components/document/StageTracker'
import { StreamingDocumentViewer } from '@/components/document/StreamingDocumentViewer'
import { StreamToolbar } from '@/components/document/StreamToolbar'
import { GenerationSummary } from '@/components/document/GenerationSummary'

// Tabs workspace layout
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { PlanReviewEditor } from '@/components/document/PlanReviewEditor'

import { saveHistoryEntry } from '@/services/historyDB'

type PageStatus = 'idle' | 'planning' | 'executing' | 'synthesizing' | 'reflecting' | 'generating' | 'reviewing' | 'completed' | 'error'

export const GeneratePage: React.FC = () => {
  // Read default workspace settings from localStorage
  const getStoredSettings = () => {
    try {
      const stored = localStorage.getItem('agentdoc_user_settings')
      if (stored) return JSON.parse(stored)
    } catch (e) {
      console.error(e)
    }
    return null
  }

  // Form input states
  const [requestText, setRequestText] = useState('')
  const [format, setFormat] = useState<DocumentFormat>(() => getStoredSettings()?.format || 'pdf')
  const [mode, setMode] = useState<ExecutionMode>(() => getStoredSettings()?.mode || 'standard')
  const [requireReview, setRequireReview] = useState(() => getStoredSettings()?.requireReview ?? false)
  const [ignoreCache, setIgnoreCache] = useState(() => getStoredSettings()?.ignoreCache ?? false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Pipeline execution states
  const [status, setStatus] = useState<PageStatus>('idle')
  const [stageName, setStageName] = useState('Planning')
  const [resultData, setResultData] = useState<GenerationResultData | null>(null)
  const [reviewPlanData, setReviewPlanData] = useState<PlanReviewData | null>(null)
  
  // Error handling states
  const [errorType, setErrorType] = useState<ErrorType>('general')
  const [errorMessage, setErrorMessage] = useState('')

  // Active stream references for cancellation
  const activeEventSourceRef = useRef<EventSource | null>(null)
  const activeAbortControllerRef = useRef<AbortController | null>(null)

  // Throttled token buffer hook
  const { displayText, appendToken, resetText } = useStreamingBuffer()

  const demo1 =
    'Create a project plan for launching an AI-powered customer support chatbot for a mid-sized e-commerce company. Include objectives, scope, phases, timeline, team responsibilities, risks, success metrics, and next steps.'
  const demo2 =
    "We need to improve customer onboarding because users are dropping off, but we don't know exactly where. Create a practical improvement plan that can be presented to leadership. We want results quickly, the budget is limited, and engineering capacity is small. Decide what should be investigated first, make reasonable assumptions where information is missing, prioritize actions, define success metrics, risks, and a phased 90-day plan."

  // Clean up active streams and reset states
  const cleanupStreams = () => {
    if (activeEventSourceRef.current) {
      activeEventSourceRef.current.close()
      activeEventSourceRef.current = null
    }
    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort()
      activeAbortControllerRef.current = null
    }
  }

  const handleCancel = () => {
    cleanupStreams()
    setStatus('idle')
    resetText()
  }

  const handleReset = () => {
    cleanupStreams()
    setStatus('idle')
    setRequestText('')
    resetText()
    setResultData(null)
    setReviewPlanData(null)
    
    // Reload local settings defaults
    const defaults = getStoredSettings()
    setFormat(defaults?.format || 'pdf')
    setMode(defaults?.mode || 'standard')
    setRequireReview(defaults?.requireReview ?? false)
    setIgnoreCache(defaults?.ignoreCache ?? false)
  }

  const handleRunAgent = (e: React.FormEvent) => {
    e.preventDefault()
    if (!requestText.trim()) return

    cleanupStreams()
    resetText()
    setResultData(null)
    setReviewPlanData(null)
    setStatus('planning')
    setStageName('Planning')

    const callbacks = {
      onProgress: (stage: string) => {
        setStageName(stage)
        // Map stage to status
        const lowerStage = stage.toLowerCase()
        if (lowerStage.includes('plan')) setStatus('planning')
        else if (lowerStage.includes('execut')) setStatus('executing')
        else if (lowerStage.includes('synth')) setStatus('synthesizing')
        else if (lowerStage.includes('reflect')) setStatus('reflecting')
        else if (lowerStage.includes('document') || lowerStage.includes('pdf')) setStatus('generating')
      },
      onToken: (content: string) => {
        appendToken(content)
      },
      onReview: (data: PlanReviewData) => {
        cleanupStreams()
        setReviewPlanData({
          ...data,
          request: requestText,
          format,
          mode,
        })
        setStatus('reviewing')
      },
      onResult: (data: any) => {
        cleanupStreams()
        if (data && data.status === 'requires_review') {
          // Enrich with form context that the backend doesn't echo back
          setReviewPlanData({
            ...data,
            request: requestText,
            format,
            mode,
          })
          setStatus('reviewing')
        } else {
          setResultData(data)
          setStatus('completed')
          saveHistoryEntry({
            prompt: requestText,
            summary: data.summary || '',
            document_filename: data.document_filename,
            format,
            mode,
            created_at: new Date().toISOString(),
            time_taken: data.time_taken,
            active_model: data.active_model,
            llm_call_count: data.llm_call_count,
          }).catch((err) => console.error('Failed to save to IndexedDB history:', err))
        }
      },
      onError: (err: string) => {
        cleanupStreams()
        setErrorMessage(err)
        // Categorize error type
        if (err.includes('timeout') || err.includes('limit')) {
          setErrorType('timeout')
        } else if (err.includes('Connection') || err.includes('lost')) {
          setErrorType('stream-drop')
        } else if (err.includes('not reachable') || err.includes('Failed to fetch')) {
          setErrorType('network')
        } else {
          setErrorType('generation-fail')
        }
        setStatus('error')
      }
    }

    try {
      activeEventSourceRef.current = streamGeneration(
        {
          request: requestText,
          requireReview,
          format,
          mode,
          ignoreCache,
        },
        callbacks
      )
    } catch (err: any) {
      callbacks.onError(err.message || 'Failed to establish stream connection.')
    }
  }

  const handleResumeReview = () => {
    if (!reviewPlanData) return

    cleanupStreams()
    setStatus('executing')
    setStageName('Executing Synthesis')

    const controller = new AbortController()
    activeAbortControllerRef.current = controller

    const callbacks = {
      onProgress: (stage: string) => {
        setStageName(stage)
      },
      onToken: (content: string) => {
        appendToken(content)
      },
      onReview: () => {},
      onResult: (data: GenerationResultData) => {
        cleanupStreams()
        setResultData(data)
        setStatus('completed')
        if (reviewPlanData) {
          saveHistoryEntry({
            prompt: reviewPlanData.request,
            summary: data.summary || '',
            document_filename: data.document_filename,
            format: reviewPlanData.format,
            mode: reviewPlanData.mode,
            created_at: new Date().toISOString(),
            time_taken: data.time_taken,
            active_model: data.active_model,
            llm_call_count: data.llm_call_count,
          }).catch((err) => console.error('Failed to save to IndexedDB history:', err))
        }
      },
      onError: (err: string) => {
        cleanupStreams()
        setErrorMessage(err)
        setErrorType('generation-fail')
        setStatus('error')
      }
    }

    streamPlanExecution(reviewPlanData, callbacks, controller.signal)
  }

  const handleUpdatePlan = (updatedPlan: TaskItem[]) => {
    if (!reviewPlanData) return
    setReviewPlanData({
      ...reviewPlanData,
      plan: updatedPlan,
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Idle Form State */}
      {status === 'idle' && (
        <>
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
                  <Select value={format} onValueChange={(val) => setFormat(val as DocumentFormat)}>
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
                  <Select value={mode} onValueChange={(val) => setMode(val as ExecutionMode)}>
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
        </>
      )}

      {/* 2. Loading & Streaming State */}
      {status !== 'idle' && status !== 'reviewing' && status !== 'completed' && status !== 'error' && (
        <div className="flex flex-col gap-6 animate-[fadeIn_0.3s_ease-out]">
          <SectionHeader 
            title="Synthesizing Document..." 
            subtitle="The agent is dynamically drafting and structuring your request in real time."
            actions={<StreamToolbar onCancel={handleCancel} />}
          />
          
          {/* Stage Tracker Pipeline Flow */}
          <StageTracker currentStage={stageName} />

          {/* Real-time Streaming Feed Box */}
          <StreamingDocumentViewer 
            content={displayText} 
            isStreaming={true} 
            title="Streaming Content Preview"
          />
        </div>
      )}

      {/* 3. Review Plan State */}
      {status === 'reviewing' && reviewPlanData && (
        <div className="flex flex-col gap-6 animate-[fadeIn_0.3s_ease-out]">
          <SectionHeader 
            title="Review Generation Plan" 
            subtitle="The planner agent has outlined the synthesis path. Review the structure before execution."
            actions={
              <Button onClick={handleCancel} variant="outline" size="sm" className="gap-2 text-muted-foreground cursor-pointer">
                Cancel
              </Button>
            }
          />

          <PlanReviewEditor 
            plan={reviewPlanData.plan}
            onChange={handleUpdatePlan}
            onResume={handleResumeReview}
          />
        </div>
      )}

      {/* 4. Completed Success State */}
      {status === 'completed' && resultData && (
        <div className="flex flex-col gap-6 animate-[fadeIn_0.3s_ease-out]">
          <SectionHeader 
            title="Document Completed Successfully" 
            subtitle="The pipeline successfully compiled all document modules into the output build."
            actions={<StreamToolbar onReset={handleReset} />}
          />

          {/* Responsive columns layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left Column: Tabbed Workspace (spans 2 columns on lg) */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <Tabs defaultValue="document" className="w-full">
                <TabsList className="mb-2">
                  <TabsTrigger value="document">Document</TabsTrigger>
                  <TabsTrigger value="execution">Execution</TabsTrigger>
                  <TabsTrigger value="insights">Insights</TabsTrigger>
                </TabsList>

                {/* Tab 1: Document (Default & Primary Focus) */}
                <TabsContent value="document" className="focus-visible:ring-0">
                  <StreamingDocumentViewer 
                    content={resultData.summary} 
                    isStreaming={false} 
                    title="Output Content Preview"
                  />
                </TabsContent>

                {/* Tab 2: Execution (Optional Details - Stepper + Collapsed logs) */}
                <TabsContent value="execution" className="flex flex-col gap-6 text-left focus-visible:ring-0 animate-[fadeIn_0.15s_ease-out]">
                  <Card className="border-border shadow-sm">
                    <CardHeader className="border-b border-border pb-3 bg-muted/10">
                      <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                        Execution Pipeline Stages
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <StageTracker currentStage="completed" />
                    </CardContent>
                  </Card>

                  {/* Natively Collapsible System Execution Logs */}
                  <details className="group border border-border rounded-lg bg-muted/5 overflow-hidden">
                    <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/15 transition-colors font-semibold text-xs text-muted-foreground uppercase tracking-wider select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                      <span className="flex items-center gap-2">
                        System Execution Logs
                        <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground/80 font-normal normal-case">
                          Click to expand
                        </Badge>
                      </span>
                      <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180 text-muted-foreground" />
                    </summary>
                    <div className="p-4 border-t border-border bg-background font-mono text-[11px] text-foreground leading-relaxed text-left max-h-[250px] overflow-y-auto flex flex-col gap-1.5">
                      <div className="text-emerald-700 font-semibold">[SUCCESS] Document generation pipeline completed in {resultData.time_taken?.toFixed(1) || '0.0'}s.</div>
                      <div className="text-muted-foreground">[INFO] Target format resolved to: {format.toUpperCase()}</div>
                      <div className="text-muted-foreground">[INFO] Loaded environment configurations. Cache mode: ENABLED.</div>
                      <div className="text-muted-foreground">[INFO] Connection initialized to LLM provider stream node.</div>
                      <div className="text-muted-foreground">[INFO] Stage 1 (Planning): Generated task outline with 5 sequential modules.</div>
                      <div className="text-muted-foreground">[INFO] Stage 2 (Execution): Sequentially executed tool tasks with budget client:</div>
                      <div className="text-muted-foreground">  - Task 1 (Analysis): Completed with 100% confidence.</div>
                      <div className="text-muted-foreground">  - Task 2 (Knowledge): Pulled context datasets.</div>
                      <div className="text-muted-foreground">[INFO] Stage 3 (Synthesis): Combined 2 modules, formatted layout markdown.</div>
                      <div className="text-muted-foreground">[INFO] Stage 4 (Reflection): Self-Check score 94/100 (Excellent).</div>
                      <div className="text-emerald-700">[SUCCESS] Output build successfully generated: {resultData.document_filename}</div>
                    </div>
                  </details>
                </TabsContent>

                {/* Tab 3: Insights (Advanced metrics/insights details) */}
                <TabsContent value="insights" className="focus-visible:ring-0">
                  <GenerationSummary data={resultData} />
                </TabsContent>
              </Tabs>
            </div>

            {/* Right Column: Sidebar containing primary Actions ONLY */}
            <div className="flex flex-col gap-6 text-left">
              {/* Primary Actions Card */}
              <Card className="border-border shadow-sm">
                <CardHeader className="border-b border-border pb-3 bg-muted/10">
                  <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                    Document Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 flex flex-col gap-3">
                  {/* Download primary button */}
                  <a 
                    href={getDocumentDownloadUrl(resultData.document_filename)}
                    download
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/95 h-11 w-full gap-2 font-semibold"
                  >
                    <Download className="h-4 w-4" /> Download {format.toUpperCase()} Document
                  </a>

                  {/* Client-side markdown export if format is not already markdown */}
                  {format !== 'md' && (
                    <a 
                      href={`data:text/markdown;charset=utf-8,${encodeURIComponent(resultData.summary)}`}
                      download={`${resultData.document_filename.split('.')[0] || 'agentdoc_export'}.md`}
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-transparent shadow-sm hover:bg-accent/5 hover:text-accent-foreground h-11 w-full gap-2 text-foreground font-semibold"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground" /> Download Markdown (.md)
                    </a>
                  )}

                  {/* Reset/Generate Another button */}
                  <Button 
                    onClick={handleReset} 
                    variant="outline" 
                    className="w-full h-11 gap-2 border-border text-muted-foreground hover:bg-muted/5 mt-1 font-semibold"
                  >
                    <RefreshCw className="h-4 w-4" /> Generate New Document
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* 5. Error State */}
      {status === 'error' && (
        <ErrorState 
          type={errorType}
          message={errorMessage}
          onRetry={handleReset}
          retryLabel="Try Again"
        />
      )}
    </div>
  )
}
export default GeneratePage
