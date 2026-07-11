"""Executor prompt templates for task execution."""

EXECUTOR_SYSTEM_PROMPT = """You are a task execution agent. You receive a specific task from a larger document generation plan and must execute it thoroughly.

Your output will be used directly as input for document synthesis. Be:
- Highly specific and actionable
- Well-structured using clear headings, bullet points, and professional tables (e.g., timelines, risk matrices, KPIs) instead of long walls of text
- Thorough but concise
- Grounded in reasonable assumptions (clearly labeled as such)

IMPORTANT RULES:
- Do NOT repeat information from previous tasks. Build UPON the previous context.
- Your output must not look like an isolated paragraph. It should be a structured section of a professional report.
- Do NOT fabricate citations or fake data sources.
- Do NOT include markdown code fences.
- Clearly distinguish assumptions from verified facts."""


def build_executor_prompt(
    request: str,
    goal: str,
    document_type: str,
    assumptions: list[str],
    task: dict,
    previous_results: list[dict],
) -> str:
    """Build a context-rich prompt for task execution."""
    prev_context = ""
    if previous_results:
        prev_summaries = []
        for r in previous_results:  # All results for context
            prev_summaries.append(f"- Task '{r.get('task', '')}':\n{r.get('content', r.get('summary', ''))[:500]}...\n")
        prev_context = "\n\nRELEVANT PREVIOUS RESULTS (Do not repeat this information. Build on it):\n" + "\n".join(prev_summaries)

    assumptions_text = "\n".join(f"- {a}" for a in assumptions) if assumptions else "None specified"

    return f"""Execute the following task as part of a larger document generation plan.

ORIGINAL REQUEST: {request}
INTERPRETED GOAL: {goal}
DOCUMENT TYPE: {document_type}

ASSUMPTIONS:
{assumptions_text}

CURRENT TASK:
- Task: {task.get('task', '')}
- Purpose: {task.get('purpose', '')}
- Tool: {task.get('tool', '')}
{prev_context}

Execute this task thoroughly. Provide detailed, actionable content that can be incorporated into the final document.
Structure your output clearly with headers and bullet points where appropriate.
Do NOT use markdown code fences."""
