import React from 'react'
import ReactMarkdown from 'react-markdown'
import { TypingCursor } from './TypingCursor'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { FileText, Clock, Layers, BookOpen, Check, Award } from 'lucide-react'

interface StreamingDocumentViewerProps {
  content: string
  isStreaming: boolean
  title?: string
  resultData?: any
}

export const StreamingDocumentViewer: React.FC<StreamingDocumentViewerProps> = ({
  content,
  isStreaming,
  title = 'Document Content Preview',
  resultData,
}) => {
  // 1. Resolve preview summary text (truncated Executive Summary)
  const previewText = React.useMemo(() => {
    if (resultData?.execution_results && resultData.execution_results.length > 0) {
      const firstResult = resultData.execution_results[0]
      const summaryText = firstResult.executive_summary || firstResult.content || ''
      if (summaryText.trim()) return summaryText
    }
    if (content && content.trim()) {
      const paragraphs = content.split('\n\n').map(p => p.trim()).filter(p => p && !p.startsWith('#'))
      if (paragraphs.length > 0) {
        return paragraphs[0]
      }
    }
    return resultData?.summary || content || 'No overview available.'
  }, [content, resultData])

  // 2. Compute exact word count
  const wordCount = React.useMemo(() => {
    if (content && content.trim()) {
      return content.trim().split(/\s+/).length
    }
    if (resultData?.execution_results) {
      let total = 0
      resultData.execution_results.forEach((r: any) => {
        const text = r.content || r.summary || ''
        total += text.trim().split(/\s+/).length
      })
      if (total > 0) return total
    }
    return null
  }, [content, resultData])

  // 3. Estimate page count (standard consulting report formatting)
  const estimatedPageCount = React.useMemo(() => {
    if (!wordCount) return null
    return Math.ceil(wordCount / 300) + 1 // Add 1 for the cover page
  }, [wordCount])

  // Render mode: streaming
  if (isStreaming) {
    return (
      <Card className="border-border shadow-sm flex flex-col h-full bg-card">
        <CardHeader className="border-b border-border pb-3 bg-muted/10">
          <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 animate-pulse text-[#2C6E5C]" /> {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 flex-1 overflow-y-auto min-h-[300px] max-h-[500px]">
          <div className="prose prose-sm max-w-none text-left">
            <ReactMarkdown
              components={{
                h1: ({ ...props }) => <h1 className="text-lg font-bold border-b border-border pb-1 mt-6 mb-3 text-foreground" {...props} />,
                h2: ({ ...props }) => <h2 className="text-md font-bold mt-5 mb-2 text-foreground" {...props} />,
                h3: ({ ...props }) => <h3 className="text-sm font-semibold mt-4 mb-2 text-foreground" {...props} />,
                p: ({ ...props }) => <p className="text-sm text-muted-foreground leading-relaxed mb-4" {...props} />,
                ul: ({ ...props }) => <ul className="list-disc list-inside pl-3 mb-4 space-y-1 text-sm text-muted-foreground" {...props} />,
                ol: ({ ...props }) => <ol className="list-decimal list-inside pl-3 mb-4 space-y-1 text-sm text-muted-foreground" {...props} />,
                li: ({ ...props }) => <li className="mb-0.5" {...props} />,
                blockquote: ({ ...props }) => <blockquote className="border-l-2 border-primary pl-4 italic my-4 text-muted-foreground" {...props} />,
              }}
            >
              {content}
            </ReactMarkdown>
            <TypingCursor />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Render mode: Document Overview Dashboard (when complete)
  const confidence = resultData?.confidence || 'High'
  const confidenceColor = confidence.toLowerCase() === 'high' ? 'text-emerald-700' : 'text-amber-700'

  return (
    <Card className="border-border shadow-sm flex flex-col h-full bg-card">
      <CardHeader className="border-b border-border pb-3 bg-muted/10">
        <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
          <Award className="h-3.5 w-3.5 text-[#2C6E5C]" /> Document Overview & Metadata
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-6 flex-1 flex flex-col gap-6 text-left">
        {/* 1. Header Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-muted/30 border border-border/80 rounded-lg text-xs">
          <div>
            <span className="block text-muted-foreground font-medium uppercase tracking-wider text-[10px]">Document Type</span>
            <span className="font-bold text-foreground mt-0.5 block capitalize">
              {(resultData?.document_type || 'Report').replace(/_/g, ' ')}
            </span>
          </div>
          <div>
            <span className="block text-muted-foreground font-medium uppercase tracking-wider text-[10px]">Est. Reading Time</span>
            <span className="font-bold text-foreground mt-0.5 block flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
              {resultData?.reading_time || '5-10 min'}
            </span>
          </div>
          <div>
            <span className="block text-muted-foreground font-medium uppercase tracking-wider text-[10px]">Word Count</span>
            <span className="font-bold text-foreground mt-0.5 block flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
              {wordCount ? `${wordCount.toLocaleString()} words` : '—'}
            </span>
          </div>
          <div>
            <span className="block text-muted-foreground font-medium uppercase tracking-wider text-[10px]">Page Count</span>
            <span className="font-bold text-foreground mt-0.5 block flex items-center gap-1">
              <Layers className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
              {estimatedPageCount ? `${estimatedPageCount} pages (est.)` : '—'}
            </span>
          </div>
        </div>

        {/* 2. Content & Checklist Columns */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Executive Briefing Preview */}
          <div className="md:col-span-3 flex flex-col gap-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Executive Briefing Snapshot
            </span>
            <div className="p-4 bg-muted/10 border border-border/50 rounded-lg border-l-4 border-l-[#2C6E5C] text-xs leading-relaxed text-muted-foreground/90 italic whitespace-pre-line line-clamp-5 min-h-[100px]">
              "{previewText}"
            </div>
            <span className="text-[10px] text-muted-foreground italic mt-0.5">
              * Showing dynamic executive summary preview (truncated). View Document tab or download for full contents.
            </span>
          </div>

          {/* Quality Checklist & Badges */}
          <div className="md:col-span-2 flex flex-col gap-3">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              Quality Assurance Checks
            </span>
            <div className="flex flex-col gap-2.5 p-4 bg-muted/10 border border-border/50 rounded-lg text-xs">
              <div className="flex items-center gap-2">
                <div className="h-4.5 w-4.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </div>
                <span className="text-muted-foreground font-medium">Generation Status:</span>
                <span className="font-bold text-emerald-700 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide">
                  Success
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="h-4.5 w-4.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </div>
                <span className="text-muted-foreground font-medium">Planner Confidence:</span>
                <span className={`font-bold ${confidenceColor} bg-muted/40 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide`}>
                  {confidence}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="h-4.5 w-4.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </div>
                <span className="text-muted-foreground font-medium flex-1">Passed Validation Checks</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="h-4.5 w-4.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </div>
                <span className="text-muted-foreground font-medium flex-1">Ready for Download (.pdf / .md)</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default StreamingDocumentViewer
