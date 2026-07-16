export type DocumentFormat = 'pdf' | 'docx' | 'md'
export type ExecutionMode = 'standard' | 'advanced' | 'adaptive'

export interface GenerationRequestParams {
  request: string
  requireReview: boolean
  format: DocumentFormat
  mode: ExecutionMode
  ignoreCache: boolean
}

export type PipelineStage = 'planning' | 'executing' | 'synthesizing' | 'reflecting' | 'generating'

export interface TaskItem {
  id: string
  task: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  depends_on?: string[]
}

export interface PlanReviewData {
  plan: TaskItem[]
  request: string
  format: DocumentFormat
  mode: ExecutionMode
  // Fields from the backend AgentResponse (status=requires_review)
  goal?: string
  document_type?: string
  confidence?: string
  confidence_reason?: string
  complexity?: string
  complexity_reason?: string
  reading_time?: string
  implementation_effort?: string
  planning_summary?: string
  assumptions?: string[]
}

export interface GenerationResultData {
  summary: string
  document_filename: string
  stage_metrics?: Record<string, number>
  llm_tokens_used?: number
  llm_call_count?: number
  time_taken?: number
  active_model?: string
  provider?: string
  // Explainability & Insights fields
  goal?: string
  document_type?: string
  confidence?: string
  confidence_reason?: string
  complexity?: string
  complexity_reason?: string
  reading_time?: string
  implementation_effort?: string
  planning_summary?: string
  assumptions?: string[]
  routing_outcome?: string
  fallback_reason?: string
  reflection?: {
    passed: boolean
    grade?: string
    reason?: string
    issues_found?: string[]
    improvements_applied?: string[]
    error?: string
  }
}

export type SSEEvent =
  | { type: 'progress'; stage: string }
  | { type: 'token'; content: string }
  | { type: 'review'; data: PlanReviewData }
  | { type: 'result'; data: GenerationResultData }
  | { type: 'error'; error: string }
