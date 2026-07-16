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
}

export type SSEEvent =
  | { type: 'progress'; stage: string }
  | { type: 'token'; content: string }
  | { type: 'review'; data: PlanReviewData }
  | { type: 'result'; data: GenerationResultData }
  | { type: 'error'; error: string }
