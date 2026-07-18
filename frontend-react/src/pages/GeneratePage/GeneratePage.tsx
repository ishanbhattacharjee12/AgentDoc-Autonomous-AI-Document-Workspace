import React, { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select'
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
import { InsightsPanel } from '@/components/document/InsightsPanel'
import { Tooltip } from '@/components/ui/tooltip'
import { TaskCard } from '@/components/document/TaskCard'

// Tabs workspace layout
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { PlanReviewEditor } from '@/components/document/PlanReviewEditor'

import { saveHistoryEntry } from '@/services/historyDB'
import { useCommandPalette } from '@/components/layout/CommandPalette/CommandPaletteContext'
import { deriveDocumentTitle, deriveDocumentSummary } from '@/utils/historyHelpers'

type PageStatus = 'idle' | 'planning' | 'executing' | 'synthesizing' | 'reflecting' | 'generating' | 'reviewing' | 'completed' | 'error'

const getStageHeaderInfo = (stage: string) => {
  const s = stage.toLowerCase()
  if (s.includes('plan')) {
    return {
      title: "Planning Document...",
      subtitle: "The agent is establishing assumptions and building an optimized execution plan."
    }
  }
  if (s.includes('execut')) {
    return {
      title: "Executing Research...",
      subtitle: "The agent is researching, gathering context, and running plan tasks sequentially."
    }
  }
  if (s.includes('synth')) {
    return {
      title: "Synthesizing Document...",
      subtitle: "The agent is dynamically drafting and structuring your request in real time."
    }
  }
  if (s.includes('reflect')) {
    return {
      title: "Reflecting & Refining...",
      subtitle: "The agent is self-correcting, auditing quality, and polishing the final output."
    }
  }
  if (s.includes('document') || s.includes('pdf') || s.includes('generat')) {
    return {
      title: "Generating File...",
      subtitle: "The agent is compiling the finalized content into your requested document format."
    }
  }
  return {
    title: "Synthesizing Document...",
    subtitle: "The agent is dynamically drafting and structuring your request in real time."
  }
}

export const GeneratePage: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()

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

  // Seed states from router template navigation if present
  const routerPrompt = (location.state as any)?.prompt || ''
  const routerMode = (location.state as any)?.mode || ''

  // Form input states
  const [requestText, setRequestText] = useState(routerPrompt)
  const [format, setFormat] = useState<DocumentFormat>(() => getStoredSettings()?.format || 'pdf')
  const [mode, setMode] = useState<ExecutionMode>(() => routerMode || getStoredSettings()?.mode || 'standard')
  const [requireReview, setRequireReview] = useState(() => getStoredSettings()?.requireReview ?? false)
  const [ignoreCache, setIgnoreCache] = useState(() => getStoredSettings()?.ignoreCache ?? false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Clear location state on mount to prevent refresh re-populating prompt
  useEffect(() => {
    if (location.state) {
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location, navigate])

  // Pipeline execution states
  const [status, setStatus] = useState<PageStatus>('idle')
  const [stageName, setStageName] = useState('Planning')
  const [resultData, setResultData] = useState<GenerationResultData | null>(null)
  const [reviewPlanData, setReviewPlanData] = useState<PlanReviewData | null>(null)
  const [showSuccessBanner, setShowSuccessBanner] = useState(false)
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(1)
  
  // Sync generating state globally to lock navigation during stream runs
  useEffect(() => {
    const isGenerating = status !== 'idle' && status !== 'reviewing' && status !== 'completed' && status !== 'error';
    (window as any).__agentdoc_generating = isGenerating;
    (window as any).__agentdoc_active_prompt = requestText;
    (window as any).__agentdoc_active_format = format;
    (window as any).__agentdoc_active_mode = mode;
    (window as any).__agentdoc_active_status = status;
    if (status !== 'idle') {
      (window as any).__agentdoc_active_timestamp = (window as any).__agentdoc_active_timestamp || new Date().toISOString();
    } else {
      (window as any).__agentdoc_active_timestamp = null;
    }
    
    window.dispatchEvent(new CustomEvent('agentdoc-status-change', {
      detail: { status, requestText, format, mode }
    }));
    
    return () => {
      (window as any).__agentdoc_generating = false;
    }
  }, [status, requestText, format, mode])

  // Error handling states
  const [errorType, setErrorType] = useState<ErrorType>('general')
  const [errorMessage, setErrorMessage] = useState('')

  // Active stream references for cancellation
  const activeEventSourceRef = useRef<EventSource | null>(null)
  const activeAbortControllerRef = useRef<AbortController | null>(null)

  // Throttled token buffer hook
  const { displayText, appendToken, resetText } = useStreamingBuffer()
  const { registerAction, unregisterAction } = useCommandPalette()
  const promptRef = useRef<HTMLTextAreaElement>(null)

  // Mutable ref of contextual handlers updated on every render
  const actionsRef = useRef({
    generate: () => {},
    resume: () => {},
    newDocument: () => {},
    focusPrompt: () => {},
    downloadPdf: () => {},
    downloadMd: () => {},
  })

  useEffect(() => {
    actionsRef.current = {
      generate: () => {
        if (status === 'idle' && requestText.trim()) {
          const mockEvent = { preventDefault: () => {} } as React.FormEvent
          handleRunAgent(mockEvent)
        }
      },
      resume: () => {
        if (status === 'reviewing') {
          handleResumeReview()
        }
      },
      newDocument: () => {
        if (status === 'completed' || status === 'error' || status === 'idle') {
          handleReset()
        } else {
          if (window.confirm('Active document generation in progress. Start new document anyway?')) {
            handleReset()
          }
        }
      },
      focusPrompt: () => {
        if (status === 'idle') {
          promptRef.current?.focus()
        }
      },
      downloadPdf: () => {
        if (status === 'completed' && resultData?.document_filename) {
          window.location.href = getDocumentDownloadUrl(resultData.document_filename)
        }
      },
      downloadMd: () => {
        if (status === 'completed' && resultData?.document_filename) {
          const baseFilename = resultData.document_filename.replace(/\.(pdf|docx)$/, '')
          window.location.href = getDocumentDownloadUrl(`${baseFilename}.md`)
        }
      }
    }
  })

  // Register palette command actions conditionally based on page status
  useEffect(() => {
    // Actions always available on this page
    registerAction('new-document', () => actionsRef.current.newDocument())

    // Actions available only in idle state
    if (status === 'idle') {
      registerAction('generate', () => actionsRef.current.generate())
      registerAction('focus-prompt', () => actionsRef.current.focusPrompt())
    }

    // Actions available only in reviewing state
    if (status === 'reviewing') {
      registerAction('resume', () => actionsRef.current.resume())
    }

    // Actions available only in completed state
    if (status === 'completed') {
      registerAction('download-pdf', () => actionsRef.current.downloadPdf())
      registerAction('download-md', () => actionsRef.current.downloadMd())
    }

    return () => {
      unregisterAction('new-document')
      unregisterAction('generate')
      unregisterAction('focus-prompt')
      unregisterAction('resume')
      unregisterAction('download-pdf')
      unregisterAction('download-md')
    }
  }, [registerAction, unregisterAction, status])



  const demoTemplates = [
    { title: "🚀 AI Chatbot Launch", prompt: "Create a project plan for launching an AI-powered customer support chatbot, including technical deliverables, remote team coordination tasks, and a 6-month phased rollout timeline." },
    { title: "📑 SaaS Business Proposal", prompt: "Draft a comprehensive SaaS business proposal targeting corporate clients, detailing software architectures, security assurance, service level agreements, and cost-benefit estimations." },
    { title: "📊 Quarterly Review", prompt: "Synthesize a Quarterly Business Review (QBR) template outlining remote engineering capacity adjustments, project milestone compliance, and strategic targets for the next half." },
    { title: "🧑‍💼 Onboarding Handbook", prompt: "Write a modern onboarding roadmap and general employee handbook for remote engineers, documenting culture principles, code review guidelines, and security setup protocols." },
    { title: "🎯 Marketing Launch", prompt: "Outline a 90-day marketing launch strategy for an AI productivity app, highlighting targeted channels, conversion funnels, brand values, and campaign success metrics." }
  ]

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
          const enrichedData = {
            ...data,
            time_taken: data.total_execution_time || data.time_taken
          }
          setResultData(enrichedData)
          setStatus('completed')
          setShowSuccessBanner(true)
          const derivedTitle = deriveDocumentTitle(data.title, requestText, displayText, data.document_type)
          const derivedSummary = deriveDocumentSummary(data.summary, data.execution_results, displayText)
          saveHistoryEntry({
            title: derivedTitle,
            prompt: requestText,
            summary: derivedSummary,
            document_filename: data.document_filename,
            format,
            mode,
            created_at: new Date().toISOString(),
            time_taken: enrichedData.time_taken,
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
        const enrichedData = {
          ...data,
          time_taken: data.total_execution_time || (data as any).total_execution_time || data.time_taken
        }
        setResultData(enrichedData)
        setStatus('completed')
        setShowSuccessBanner(true)
        if (reviewPlanData) {
          const derivedTitle = deriveDocumentTitle(data.title, reviewPlanData.request, displayText, data.document_type)
          const derivedSummary = deriveDocumentSummary(data.summary, data.execution_results, displayText)
          saveHistoryEntry({
            title: derivedTitle,
            prompt: reviewPlanData.request,
            summary: derivedSummary,
            document_filename: data.document_filename,
            format: reviewPlanData.format,
            mode: reviewPlanData.mode,
            created_at: new Date().toISOString(),
            time_taken: enrichedData.time_taken,
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

          <form onSubmit={handleRunAgent} className="flex flex-col gap-5">
            {/* Main Input Textarea */}
            <Card className="border-border shadow-xs">
              <CardContent className="p-5 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="prompt-input" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Document Request Prompt
                  </label>
                  <textarea
                    ref={promptRef}
                    id="prompt-input"
                    rows={6}
                    className="flex w-full rounded-lg border border-input bg-transparent px-3.5 py-3 text-sm shadow-2xs placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 min-h-[140px] resize-y leading-relaxed font-normal"
                    placeholder={`Describe the document you'd like AgentDoc to create...

Include details like:
• Target Audience & Objectives
• Design Constraints & Formatting rules
• Writing Tone & Style preferences

Example: "Create a Software Requirements Specification for an e-commerce platform targeting small businesses."`}
                    value={requestText}
                    onChange={(e) => setRequestText(e.target.value)}
                  />
                </div>

                {/* Quick Demos (Richer templates with hover-lift) */}
                <div className="flex flex-col gap-2 mt-1 border-t border-border/60 pt-4.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Quick Start Templates
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {demoTemplates.map((template, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setRequestText(template.prompt)}
                        className="hover-lift inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-foreground bg-card border border-border rounded-lg shadow-2xs hover:bg-muted/10 transition-colors cursor-pointer"
                      >
                        {template.title}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

             {/* Pipeline options bar */}
            <Card className="border-border">
              <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {/* Format Selection */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Document Format
                  </label>
                  <Select value={format} onValueChange={(val) => setFormat(val as DocumentFormat)}>
                    <SelectTrigger className="w-full bg-background shadow-xs">
                      {format === 'pdf' && 'PDF Document'}
                      {format === 'docx' && 'Word Document (.docx)'}
                      {format === 'md' && 'Markdown File (.md)'}
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
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    Execution Strategy
                    <Tooltip 
                      side="bottom"
                      content={`• Standard: Fast single-pass generation. Best for simple templates.\n• Advanced: Multi-stage sequential task execution for maximum depth.\n• Adaptive: Auto-routes based on prompt complexity with error fallback.`}
                    />
                  </label>
                  <Select value={mode} onValueChange={(val) => setMode(val as ExecutionMode)}>
                    <SelectTrigger className="w-full bg-background shadow-xs">
                      {mode === 'standard' && 'Standard Mode (Linear)'}
                      {mode === 'advanced' && 'Advanced Mode (Reflection)'}
                      {mode === 'adaptive' && 'Adaptive Mode (Automatic)'}
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
                    <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      Require Review
                      <Tooltip content="Pause after the planning stage so you can inspect, edit, and reorganize outline steps before generation starts." />
                    </span>
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
                className="w-full flex items-center justify-between px-5 py-3.5 text-left border-none bg-transparent hover:bg-muted/5 transition-colors focus:outline-none"
              >
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold text-foreground">Advanced Options</span>
                </div>
                {showAdvanced ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>
              
              {showAdvanced && (
                <CardContent className="px-5 pb-5 border-t border-border pt-5 flex flex-col gap-5 animate-[fadeIn_0.2s_ease-out]">
                  {/* Bypass cache toggle */}
                  <div className="flex items-center justify-between max-w-md">
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                        Bypass Request Cache <AlertTriangle className="h-3.5 w-3.5 text-destructive inline" />
                        <Tooltip content="Force a fresh run instead of reading from cached previous responses for this prompt." />
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
            <div className="flex justify-center mt-2">
              <Button
                type="submit"
                disabled={!requestText.trim()}
                className="font-semibold px-8 py-6 h-auto text-base gap-3"
              >
                <Sparkles className="h-5 w-5" /> Run Agent Pipeline
              </Button>
            </div>
          </form>
        </>
      )}

      {/* 2. Loading & Streaming State */}
      {status !== 'idle' && status !== 'reviewing' && status !== 'completed' && status !== 'error' && (
        <div className="flex flex-col gap-6 animate-[fadeIn_0.3s_ease-out]">
          {(() => {
            const headerInfo = getStageHeaderInfo(stageName)
            return (
              <SectionHeader 
                title={headerInfo.title} 
                subtitle={headerInfo.subtitle}
                actions={<StreamToolbar onCancel={handleCancel} />}
              />
            )
          })()}
          
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
          {showSuccessBanner && (
            <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-400 px-4 py-3 rounded-lg text-sm font-medium animate-[fadeIn_0.15s_ease-out]">
              <span className="flex items-center gap-2">
                <span className="font-semibold">✓</span> Document generated successfully
              </span>
              <button 
                onClick={() => setShowSuccessBanner(false)}
                className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 font-semibold text-xs ml-4 cursor-pointer focus:outline-none"
              >
                Dismiss
              </button>
            </div>
          )}
          <SectionHeader 
            title="Document Completed Successfully" 
            subtitle="The pipeline successfully compiled all document modules into the output build."
            actions={<StreamToolbar onReset={handleReset} />}
          />

          {/* Responsive columns layout */}
          <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
            {/* Left Column: Tabbed Workspace */}
            <div className="flex-1 w-full lg:min-w-0 flex flex-col gap-4">
              <Tabs defaultValue="document" className="w-full">
                <TabsList className="mb-2">
                  <TabsTrigger value="document">Document</TabsTrigger>
                  <TabsTrigger value="execution">Execution</TabsTrigger>
                  <TabsTrigger value="insights">Insights</TabsTrigger>
                </TabsList>

                {/* Tab 1: Document (Default & Primary Focus Preview) */}
                <TabsContent value="document" className="focus-visible:ring-0">
                  <StreamingDocumentViewer 
                    content={displayText} 
                    isStreaming={false} 
                    title="Output Content Preview"
                    resultData={resultData}
                  />
                </TabsContent>

                {/* Tab 2: Execution (Details - Stepper + Stepper Breakdown + Logs) */}
                <TabsContent value="execution" className="flex flex-col gap-5 text-left focus-visible:ring-0 animate-[fadeIn_0.15s_ease-out]">
                  <StageTracker currentStage="completed" />

                  {/* Dynamic Accordion Per-Task Execution Breakdown */}
                  {resultData.execution_results && resultData.execution_results.length > 0 && (
                    <div className="flex flex-col gap-3 mt-1">
                      <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                        Per-Task Execution Breakdown
                      </h4>
                      {resultData.execution_results.map((result: any, idx: number) => {
                        const planTask = resultData.plan?.find((p: any) => p.id === result.task_id)
                        return (
                          <TaskCard 
                            key={result.task_id || idx} 
                            result={result} 
                            planTask={planTask} 
                            isExpanded={expandedTaskId === result.task_id}
                            onToggle={() => setExpandedTaskId(expandedTaskId === result.task_id ? null : result.task_id)}
                          />
                        )
                      })}
                    </div>
                  )}

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
                <TabsContent value="insights" className="focus-visible:ring-0 flex flex-col gap-6">
                  <InsightsPanel data={resultData} />
                </TabsContent>
              </Tabs>
            </div>

            {/* Sticky Right Column Utility Sidebar */}
            <div className="w-full lg:w-[270px] shrink-0 lg:sticky lg:top-6 self-start flex flex-col gap-6 text-left">
              {/* Document Actions Card */}
              <Card className="border-border shadow-sm">
                <CardHeader className="border-b border-border pb-3 bg-muted/10">
                  <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                    Document Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 flex flex-col gap-3">
                  {/* Primary Action: Download Main Format */}
                  <a 
                    href={getDocumentDownloadUrl(resultData.document_filename)}
                    download
                    className="inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-colors bg-[#2C6E5C] hover:bg-[#1f5547] text-[#FFFFFF] shadow-sm h-11 w-full gap-2 px-4 whitespace-nowrap"
                  >
                    <Download className="h-4 w-4" /> Download {format.toUpperCase()} Document
                  </a>

                  {/* Secondary Action: Download Markdown Export if format is not already markdown */}
                  {format !== 'md' && (
                    <a 
                      href={`data:text/markdown;charset=utf-8,${encodeURIComponent(resultData.summary)}`}
                      download={`${resultData.document_filename.split('.')[0] || 'agentdoc_export'}.md`}
                      className="inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-colors border border-border bg-transparent shadow-sm hover:bg-muted hover:text-foreground h-11 w-full gap-2 text-foreground px-4 whitespace-nowrap"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground" /> Download Markdown (.md)
                    </a>
                  )}

                  {/* Group Divider */}
                  <div className="border-t border-border/80 my-1" />

                  {/* Utility Action: Reset/Generate New Document */}
                  <Button 
                    onClick={handleReset} 
                    variant="outline" 
                    className="w-full h-11 gap-2 border-border text-muted-foreground hover:bg-muted/5 font-semibold px-4 whitespace-nowrap"
                  >
                    <RefreshCw className="h-4 w-4" /> Generate New Document
                  </Button>
                </CardContent>
              </Card>

              {/* Persistent Generation Details */}
              <GenerationSummary data={resultData} />
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
