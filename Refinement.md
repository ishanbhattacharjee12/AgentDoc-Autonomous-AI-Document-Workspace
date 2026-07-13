## Flagship Performance, Reliability & Provider Migration

## Objective

This phase transforms AgentDoc into a flagship portfolio-quality autonomous AI application.

The objective is NOT to redesign the project.

The existing Planner → Executor → Synthesizer → Reflector architecture must remain intact.

The goal is to significantly improve:

- Performance
- Reliability
- Provider flexibility
- Document quality
- User experience
- Explainability
- Maintainability

while preserving the existing autonomous-agent architecture.

------------------------------------------------------------------------------

# IMPORTANT

Before making ANY code changes:

1. Read the ENTIRE Build_Spec.md from top to bottom.

2. Understand every previous phase before implementing this phase.

3. Preserve every existing capability unless explicitly instructed otherwise.

4. Do NOT remove working functionality.

5. Do NOT introduce LangChain, LangGraph, CrewAI, databases, queues, Redis, Celery, or unnecessary infrastructure.

6. Preserve backward compatibility wherever possible.

7. Every change should improve the current implementation rather than replacing it.

------------------------------------------------------------------------------

# 1. COMPLETE PROVIDER MIGRATION (MANDATORY)

Completely remove the current Gemini implementation.

The application must NO LONGER use Gemini in any way.

Instead, migrate the entire project to the MiniMax M2.5 API.

The NEW MiniMax API key and model information are available inside Build_Spec.md.

IMPORTANT:

Before implementing anything:

• Locate the MiniMax API key inside Build_Spec.md.

• Use ONLY this new API key.

• Configure it inside the local .env.

• Verify that .env remains ignored by Git.

• Never expose, print, log or commit the API key.

After successfully configuring MiniMax:

Delete the OLD Gemini API key from Build_Spec.md.

Replace it with:

MiniMax API Key: [REDACTED]

Use the key only in the local .env after verifying .env is ignored.

Never expose or commit the API key.

The Build_Spec.md should no longer contain any Gemini API key.

------------------------------------------------------------------------------

# 2. REMOVE ALL GEMINI REFERENCES

Search the ENTIRE repository.

Remove every obsolete Gemini-specific implementation.

This includes:

- configuration
- provider code
- documentation
- README
- comments
- prompts
- examples
- troubleshooting
- environment examples
- provider checks
- setup instructions

There should be NO Gemini references remaining anywhere in the repository.

The project should behave as though MiniMax was the original provider.

------------------------------------------------------------------------------

# 3. FUTURE-PROOF PROVIDER ARCHITECTURE

Although MiniMax becomes the active provider,

DO NOT tightly couple the application to MiniMax.

Implement a proper provider abstraction.

The Planner, Executor, Synthesizer, Reflector, Streaming and Document Generation layers must NEVER directly depend on a provider.

Changing providers should require changing ONLY environment variables.

Example:

LLM_PROVIDER=opencode
MODEL=minimax-m2.5

or

MODEL=minimax-m2.7

or

MODEL=qwen3.6-plus

or

MODEL=claude-sonnet-4

Application logic must NEVER require modification when changing models.

The provider layer should be reusable for future providers.

------------------------------------------------------------------------------

# 4. PERFORMANCE OPTIMIZATION

The current execution still performs too many sequential LLM calls.

Optimize the execution pipeline while preserving output quality.

Goals:

• reduce latency

• reduce API usage

• reduce total LLM calls

• preserve planning quality

• preserve document quality

Implement:

- intelligent batching
- group compatible tasks together
- reuse execution context
- remove duplicated prompts
- reduce prompt sizes
- cache deterministic computations
- eliminate unnecessary LLM calls

Reflection should NOT execute every time.

Automatically skip Reflection whenever document quality already satisfies acceptance criteria.

Target:

Reduce execution from approximately 8–10 LLM calls to around 3–4 LLM calls without sacrificing quality.

------------------------------------------------------------------------------

# 5. PLANNER IMPROVEMENTS

Improve planning quality.

Generate:

- stronger assumptions
- better task ordering
- dynamic plans
- document-specific workflows

Avoid generic planning templates.

Different document types must produce genuinely different execution plans.

Expose:

- Planning Summary
- Confidence
- Complexity
- Estimated Reading Time
- Estimated Implementation Effort

------------------------------------------------------------------------------

# 6. EXECUTOR IMPROVEMENTS

Improve execution quality.

Executor prompts should generate:

- tables
- matrices
- structured analysis
- concise reasoning
- actionable recommendations

instead of long generic paragraphs.

When batching tasks, maintain individual task status for the frontend.

------------------------------------------------------------------------------

# 7. SYNTHESIS IMPROVEMENTS

Produce consultant-grade reports.

Improve:

- Executive Summary
- hierarchy
- transitions
- recommendations
- readability
- formatting

Prevent:

- duplicated sections
- filler
- repeated explanations
- unnecessary verbosity

The final report should be understandable by both technical and non-technical audiences.

------------------------------------------------------------------------------

# 8. DOCUMENT GENERATION

Professionalize every exported document.

DOCX:

- proper margins
- professional typography
- attractive headings
- improved spacing
- consultant-quality tables
- better bullets
- improved title page

PDF:

- fix title overflow
- proper wrapping
- better font hierarchy
- page numbers
- footer
- consistent spacing

Generated reports should feel presentation-ready.

------------------------------------------------------------------------------

# 9. DOCUMENT PREVIEW

The current Document Preview section is incomplete.

Fix it.

Preferred implementation:

Generate HTML from the synthesized report and render it directly inside the application.

Do NOT use blank iframes.

The preview should work regardless of exported format.

If a live preview cannot be implemented reliably,

redesign or remove the section instead of leaving an empty container.

------------------------------------------------------------------------------

# 10. FRONTEND POLISH

Improve:

- spacing
- typography
- responsiveness
- animations
- transitions
- badges
- planner reasoning
- explainability
- metrics
- execution timeline

The application should feel modern and premium.

------------------------------------------------------------------------------

# 11. RELIABILITY

The application must never silently fail.

Improve handling for:

- rate limits
- retries
- invalid JSON
- provider failures
- malformed outputs

Recover gracefully whenever possible.

------------------------------------------------------------------------------

# 12. VERIFICATION

After implementation:

Run the ENTIRE application using the REAL MiniMax API.

Verify:

✓ Planning

✓ Executor

✓ Synthesis

✓ Reflection

✓ Streaming

✓ HTML Preview

✓ DOCX

✓ PDF

✓ Markdown

✓ Performance

✓ Provider Switching

✓ Document Formatting

✓ UI

Measure:

- execution time

- LLM calls

- completion rate

------------------------------------------------------------------------------

# 13. FINAL CLEANUP

Before committing:

Search the ENTIRE repository.

Ensure there are NO remaining references to:

- Gemini
- Google GenAI
- google-genai SDK
- Gemini API keys
- Gemini configuration
- Gemini setup instructions

Only MiniMax should remain as the active provider.

Update README accordingly.

------------------------------------------------------------------------------

# FINAL GOAL

The finished project should represent a flagship portfolio project suitable for AI Engineer interviews.

Priorities:

1. Reliability

2. Output Quality

3. Performance

4. User Experience

5. Clean Architecture

6. Future Maintainability

Every modification should move the project closer to production quality while preserving its autonomous-agent architecture.