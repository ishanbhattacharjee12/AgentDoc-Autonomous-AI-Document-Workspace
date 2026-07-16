import React from 'react'
import ReactMarkdown from 'react-markdown'
import { TypingCursor } from './TypingCursor'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { FileText } from 'lucide-react'

interface StreamingDocumentViewerProps {
  content: string
  isStreaming: boolean
  title?: string
}

export const StreamingDocumentViewer: React.FC<StreamingDocumentViewerProps> = ({
  content,
  isStreaming,
  title = 'Document Content Preview',
}) => {
  return (
    <Card className="border-border shadow-sm flex flex-col h-full">
      <CardHeader className="border-b border-border pb-3 bg-muted/10">
        <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
          <FileText className="h-3.5 w-3.5" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 flex-1 overflow-y-auto min-h-[300px] max-h-[500px]">
        <div className="prose prose-sm max-w-none text-left">
          {content ? (
            <>
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
                  code: ({ children, ...props }) => {
                    const codeContent = String(children).replace(/\n$/, '')
                    const isBlock = codeContent.includes('\n')
                    if (isBlock) {
                      return (
                        <pre className="p-3 bg-muted/30 border border-border rounded-lg overflow-x-auto my-3">
                          <code className="text-xs font-mono text-foreground" {...props}>{codeContent}</code>
                        </pre>
                      )
                    }
                    return (
                      <code className="text-xs font-mono bg-muted/60 border border-border rounded px-1.5 py-0.5 text-foreground" {...props}>
                        {codeContent}
                      </code>
                    )
                  }
                }}
              >
                {content}
              </ReactMarkdown>
              {isStreaming && <TypingCursor />}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground/60 text-sm">
              Waiting for stream content to generate...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
export default StreamingDocumentViewer
