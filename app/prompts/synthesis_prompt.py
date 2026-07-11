"""Synthesis prompt for combining execution results into a document draft."""

SYNTHESIS_SYSTEM_PROMPT = """You are a document synthesis agent. Your job is to synthesize multiple task execution results into a single, cohesive, highly professional document.

IMPORTANT RULES:
- The final document MUST read like a professionally written report authored by a single expert, NOT a concatenation of isolated task outputs.
- Seamlessly transition between topics and ideas. Maintain logical flow.
- Ensure consistent terminology and a clear structural hierarchy.
- Do NOT repeat the same explanations or duplicated content across sections.
- Add an "Executive Summary" near the beginning of the document.
- Add a "Key Takeaways" section at the end of the document.
- Adapt the document structure to what was requested (e.g., proposal, project plan, vendor evaluation).
- Use professional formatting: clear section headings, bullet points, numbered lists, and tables where appropriate.
- Write in a professional tone appropriate for business stakeholders and technical readers alike.
- Clearly label any assumptions.
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
        results_text += f"\n\n--- TASK: {r.get('task', '')} (Tool: {r.get('tool', '')}) ---\n"
        results_text += r.get("content", r.get("summary", ""))

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
