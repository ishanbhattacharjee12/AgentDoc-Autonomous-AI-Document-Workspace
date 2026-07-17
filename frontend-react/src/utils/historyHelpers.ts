/**
 * Helper utilities for deriving professional document titles and executive summaries
 * from prompt inputs and generated responses on the client side.
 */

export function deriveDocumentTitle(
  title: string | undefined | null,
  prompt: string,
  content?: string | undefined,
  documentType?: string
): string {
  // If the user has explicitly edited or provided a title that is not a generic prompt command
  if (title && !title.startsWith('Create ') && !title.startsWith('Write ') && !title.startsWith('Generate ')) {
    return title
  }

  // 1. Try to extract from content H1 header (e.g. `# AI Chatbot Launch Plan`)
  if (content) {
    const match = content.match(/^\s*#\s+(.+)$/m)
    if (match && match[1]) {
      const parsed = match[1].replace(/[#*`_]/g, '').trim()
      if (parsed.length > 5 && parsed.length < 80) {
        return parsed
      }
    }
  }

  // 2. Derive a cleaner title by stripping common pipeline prompt imperative prefixes
  let clean = prompt.trim()
  
  // Remove starting quotes if any
  clean = clean.replace(/^["'“`]+|["'”`]+$/g, '')

  // Remove common prompt prefixes (case insensitive)
  clean = clean.replace(/^(create|write|generate|synthesize|produce|prepare|make|draft|compile|detail|design|formulate)\s+(a|an|the)?\s*/i, '')

  // Remove document format indicator words
  clean = clean.replace(/^(consulting|professional|formal|executive-ready)?\s*(project plan|business plan|research report|improvement plan|proposal|blueprint|strategy|report|document|slide deck|slides)\s+(for|on|about|regarding)\s*/i, '')

  // Capitalize first letter of each word (Title Case)
  clean = clean.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  // Clean up minor typos or trailing punctuation
  clean = clean.replace(/[.,;:!?]+$/, '').trim()

  // Apply visual caps
  if (clean.length > 60) {
    clean = clean.slice(0, 57) + '...'
  }

  // Final fallback to document type name or default
  if (!clean) {
    const fallback = documentType || 'Generated Report'
    return fallback.replace(/_/g, ' ').toUpperCase()
  }

  return clean
}

export function deriveDocumentSummary(
  summary: string | undefined | null,
  executionResults?: any[] | undefined,
  content?: string | undefined
): string {
  // If it's not a generic pipeline completion message, use it
  const isGeneric = !summary || 
                    summary.toLowerCase().includes('successfully generated') || 
                    summary.toLowerCase().includes('document generated') ||
                    summary.toLowerCase().includes('run completed')

  if (!isGeneric && summary) {
    return summary
  }

  // 1. Try to pull the executive summary from the first task's summary result
  if (executionResults && executionResults.length > 0) {
    const first = executionResults[0]
    const text = first.executive_summary || first.summary || first.content || ''
    const cleaned = text.replace(/[#*`_-]/g, '').replace(/\s+/g, ' ').trim()
    if (cleaned.length > 30) {
      return cleaned.slice(0, 220) + (cleaned.length > 220 ? '...' : '')
    }
  }

  // 2. Try to get the first descriptive paragraph from the content markdown
  if (content) {
    const paragraphs = content.split('\n\n')
      .map(p => p.replace(/[#*`_-]/g, '').replace(/\s+/g, ' ').trim())
      .filter(p => p.length > 40 && !p.toLowerCase().startsWith('document type') && !p.toLowerCase().startsWith('author'))
    if (paragraphs.length > 0) {
      return paragraphs[0].slice(0, 220) + (paragraphs[0].length > 220 ? '...' : '')
    }
  }

  // Final default fallback
  return summary || 'Strategic consulting outline covering key implementation insights and executive recommendations.'
}
