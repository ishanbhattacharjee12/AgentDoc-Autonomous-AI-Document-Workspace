/**
 * Helper utilities for deriving professional document titles and executive summaries
 * from prompt inputs and generated responses on the client side.
 */

function cleanImperatives(text: string): string {
  let clean = text.trim()
  // Remove outer quotes
  clean = clean.replace(/^["'“`]+|["'”`]+$/g, '')
  // Remove imperative verbs
  clean = clean.replace(/^(create|write|generate|synthesize|produce|prepare|make|draft|compile|detail|design|formulate|conduct)\s+(a|an|the)?\s*/i, '')
  // Remove document type prefixes
  clean = clean.replace(/^(consulting|professional|formal|executive-ready|autonomous)?\s*(project plan|business plan|research report|improvement plan|proposal|blueprint|strategy|report|document|slide deck|slides)\s+(for|on|about|regarding)\s*/i, '')
  return clean
}

export function deriveDocumentTitle(
  title: string | undefined | null,
  prompt: string,
  content?: string | undefined,
  documentType?: string
): string {
  // If the user has explicitly edited or provided a title, preserve it
  if (title && !title.startsWith('Create ') && !title.startsWith('Write ') && !title.startsWith('Generate ')) {
    return title
  }

  // 1. Try to extract from content H1 header (e.g. `# AI Chatbot Launch Plan`)
  if (content) {
    const match = content.match(/^\s*#\s+(.+)$/m)
    if (match && match[1]) {
      const parsed = match[1].replace(/[#*`_]/g, '').trim()
      if (parsed.length > 5 && parsed.length < 80) {
        const cleanH1 = cleanImperatives(parsed)
        if (cleanH1.split(/\s+/).length <= 6) {
          return cleanH1
        }
      }
    }
  }

  const promptLower = prompt.toLowerCase()
  const typeLabel = (documentType || '').replace(/_/g, ' ').toLowerCase()

  // 2. Keyword Mapping for targeted BCG/McKinsey consulting titles
  if (promptLower.includes('customer support') || promptLower.includes('chatbot')) {
    if (typeLabel.includes('plan')) return "AI Customer Support Launch Plan"
    return "Customer Support Chatbot Strategy"
  }
  if (promptLower.includes('remote') && (promptLower.includes('productivity') || promptLower.includes('engineering'))) {
    return "Remote Engineering Productivity Plan"
  }
  if (promptLower.includes('software product launch') || promptLower.includes('software launch')) {
    return "Software Product Launch Plan"
  }
  if (promptLower.includes('onboarding') && promptLower.includes('improvement')) {
    return "Customer Onboarding Improvement Strategy"
  }
  if (promptLower.includes('llm') || promptLower.includes('enterprise workflows')) {
    return "LLM Adoption in Enterprise Workflows"
  }
  if (promptLower.includes('evolutionary biology')) {
    return "Evolutionary Biology Overview"
  }

  // 3. Fallback General Title Extractor
  let subject = cleanImperatives(prompt)
  
  // Strip starting action gerunds
  subject = subject.replace(/^(launching|building|implementing|improving|adopting|enhancing|optimizing|analyzing|structuring)\s+(a|an|the)?\s*/i, '')
  
  // Split into words and truncate at first preposition
  let words = subject.split(/\s+/)
  let stopIndex = -1
  for (let i = 1; i < Math.min(words.length, 6); i++) {
    const w = words[i].toLowerCase()
    if (["for", "in", "at", "to", "with", "by", "using", "of", "on"].includes(w)) {
      stopIndex = i
      break
    }
  }
  if (stopIndex !== -1) {
    words = words.slice(0, stopIndex)
  }
  
  // Capitalize (Title Case)
  let titleStr = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
  
  // Append suffix based on document type
  let suffix = ""
  if (typeLabel.includes('plan')) suffix = " Plan"
  else if (typeLabel.includes('improvement') || typeLabel.includes('strategy')) suffix = " Strategy"
  else if (typeLabel.includes('report') || typeLabel.includes('analysis')) suffix = " Report"
  else if (typeLabel.includes('proposal')) suffix = " Proposal"
  
  if (suffix && !titleStr.toLowerCase().endsWith(suffix.trim().toLowerCase())) {
    titleStr += suffix
  }
  
  // Enforce 3-6 words
  let finalWords = titleStr.split(/\s+/)
  if (finalWords.length > 6) {
    titleStr = finalWords.slice(0, 5).join(' ')
  }
  
  // Clean trailing prepositions/minor words
  titleStr = titleStr.trim().replace(/\s+(For|In|At|To|With|By|From|On|Using|Of|About|A|An|The)$/i, '')
  
  return titleStr || 'Generated Report'
}

export function deriveDocumentSummary(
  summary: string | undefined | null,
  executionResults?: any[] | undefined,
  content?: string | undefined,
  prompt?: string,
  documentType?: string
): string {
  // Check if summary is generic
  const isGeneric = !summary || 
                    summary.toLowerCase().includes('successfully generated') || 
                    summary.toLowerCase().includes('document generated') ||
                    summary.toLowerCase().includes('run completed')

  if (!isGeneric && summary) {
    return summary
  }

  // 1. Try to pull the executive summary from the first task's execution results
  if (executionResults && executionResults.length > 0) {
    const first = executionResults[0]
    const text = first.executive_summary || first.summary || first.content || ''
    const cleaned = text.replace(/[#*`_-]/g, '').replace(/\s+/g, ' ').trim()
    if (cleaned.length > 30) {
      return cleaned.slice(0, 240) + (cleaned.length > 240 ? '...' : '')
    }
  }

  // 2. Try to get the first descriptive paragraph from the content markdown
  if (content) {
    const paragraphs = content.split('\n\n')
      .map(p => p.replace(/[#*`_-]/g, '').replace(/\s+/g, ' ').trim())
      .filter(p => p.length > 40 && !p.toLowerCase().startsWith('document type') && !p.toLowerCase().startsWith('author'))
    if (paragraphs.length > 0) {
      return paragraphs[0].slice(0, 240) + (paragraphs[0].length > 240 ? '...' : '')
    }
  }

  // 3. Fallback based on prompt keywords and document types
  const cleanPrompt = (prompt || '').toLowerCase().replace(/[^\w\s]/g, '')
  const typeLabel = (documentType || '').replace(/_/g, ' ').toLowerCase()

  if (cleanPrompt.includes('customer support') || cleanPrompt.includes('chatbot')) {
    return 'Covers project objectives, implementation phases, stakeholder responsibilities, resource planning, risk mitigation strategies, delivery milestones, and measurable success metrics for the proposed AI customer support rollout.'
  }
  if (cleanPrompt.includes('remote') && cleanPrompt.includes('productivity')) {
    return 'Presents prioritized remote engineering protocols, async alignment frameworks, focus hour boundaries, deployment metrics, and team alignment recommendations.'
  }
  if (cleanPrompt.includes('onboarding') && cleanPrompt.includes('improvement')) {
    return 'Strategic improvement plan identifying onboarding bottlenecks, user journey milestones, prioritized recommendations, phased implementation roadmap, and KPI targets.'
  }
  if (cleanPrompt.includes('llm') || cleanPrompt.includes('enterprise workflows')) {
    return 'Analytical report outlining industry benchmarks, LLM adoption in workflows, deployment risks, stakeholder impact assessment, and integration roadmap.'
  }
  if (cleanPrompt.includes('evolutionary biology')) {
    return 'Comprehensive academic synopsis outlining core principles of evolutionary biology, adaptation mechanisms, genetic variation parameters, and developmental history.'
  }

  // Generic document type templates
  if (typeLabel.includes('project plan')) {
    return 'Covers project objectives, execution phases, resource allocation, risk mitigation strategies, implementation roadmap, and measurable success metrics.'
  }
  if (typeLabel.includes('improvement plan') || typeLabel.includes('strategy')) {
    return 'Strategic improvement plan identifying core operational bottlenecks, prioritized recommendations, phased implementation roadmap, KPI targets, and executive recommendations.'
  }
  if (typeLabel.includes('requirements')) {
    return 'Product requirements analysis detailing functional specifications, system architecture recommendations, user stories, compliance guidelines, and deployment metrics.'
  }
  if (typeLabel.includes('proposal')) {
    return 'Strategic business proposal presenting solution design, value proposition, cost-benefit analysis, execution roadmap, and organizational implementation steps.'
  }

  return 'Strategic consulting outline covering key implementation insights and executive recommendations.'
}
