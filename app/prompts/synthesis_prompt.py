"""Synthesis prompt for combining execution results into a document draft."""

SYNTHESIS_SYSTEM_PROMPT = """You are a document synthesis agent. Your job is to synthesize multiple task execution results into a single, cohesive, highly professional document.

IMPORTANT RULES:
- The final document MUST read like a cohesive, authoritative report authored by senior consultants at McKinsey, BCG, or Deloitte, NOT a concatenation of isolated task outputs.
- Use confident, direct, and active-voice business language. Never use AI preambles or filler like "this section outlines...", "the following discusses...", or "comprehensive analysis...".
- Seamlessly transition between topics and ideas. Maintain logical flow.
- Ensure consistent terminology and a clear structural hierarchy.
- AGGRESSIVELY DE-DUPLICATE INFORMATION. Do NOT repeat the same explanations across sections.
- PRODUCE ACTIONABLE CONTENT WITH NO FILLER. Avoid generic corporate speak, fluff, or stating the obvious. Every sentence should carry weight.
- Dynamically determine the most appropriate document structure based on the document type, matching the specific template style.
- Include a compact "Decision Snapshot" markdown table near the beginning (under the title) containing columns: Priority, Risk, Investment, Timeline, Expected ROI, and Confidence.
- Immediately after the Executive Summary, include a "Key Takeaways" section.
- Split recommendations into Immediate, Short-Term, and Long-Term action categories wherever appropriate.
- Strengthen the Executive Summary section by explicitly starting it with bold headings: **Problem**, **Approach**, **Business Impact**, **Recommendation**, **Expected Outcome**, and **Estimated Timeline**.
- Structuring task/phase sections consistently. Every section corresponding to a plan phase/task must include these exact subheadings:
  - `### Summary` (2–3 paragraph executive briefing of findings and actions)
  - `### Key Findings` (3–6 specific, document-specific findings as bullet points)
  - `### Recommendations` (Immediate, Short-Term, and Long-Term actionable recommendations)
  - `### Risks & Tradeoffs` (with explicit bold labels: **Primary Risk:** [risk description], **Mitigation:** [mitigation strategy], **Tradeoff:** [tradeoff description])
  - `### Deliverables` (bulleted list of specific, actual outputs generated)
  - `### Conclusion` (brief concluding summary)
- Do NOT add markdown code fences. Do NOT include raw JSON."""


def build_synthesis_prompt(
    request: str,
    goal: str,
    document_type: str,
    assumptions: list[str],
    execution_results: list[dict],
) -> str:
    """Build the synthesis prompt from execution results."""
    results_text = ""
    for r in execution_results:
        content_val = r.get("content", "").strip()
        if not content_val:
            content_val = r.get("summary", "").strip()
        if content_val:
            results_text += f"\n\n--- TASK: {r.get('task', '')} ---\n{content_val}"

    assumptions_text = "\n".join(f"- {a}" for a in assumptions) if assumptions else "None"

    return f"""Synthesize the following task execution results into a coherent, professional document.

ORIGINAL REQUEST: {request}
INTERPRETED GOAL: {goal}
DOCUMENT TYPE: {document_type}

ASSUMPTIONS:
{assumptions_text}

EXECUTION RESULTS:
{results_text}

Create a well-structured document with appropriate sections, headings, bullet points, tables, and professional formatting.
The document should be ready for presentation to its intended audience.
Do NOT use markdown code fences. Use plain text with clear section headers (prefixed with ##).
Use bullet points with - and numbered lists with 1. 2. 3. format."""
