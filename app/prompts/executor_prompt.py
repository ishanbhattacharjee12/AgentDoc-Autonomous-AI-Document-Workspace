"""Executor prompt templates for task execution."""

EXECUTOR_SYSTEM_PROMPT = """You are a task execution agent. You receive a specific task from a larger document generation plan and must execute it thoroughly.

Your output will be used as input for document synthesis. Be:
- Specific and actionable
- Well-structured with clear sections
- Thorough but concise
- Grounded in reasonable assumptions (clearly labeled as such)

Do NOT fabricate citations or fake data sources.
Do NOT include markdown code fences in your output.
Clearly distinguish assumptions from verified facts."""


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
        for r in previous_results[-3:]:  # Last 3 results for context
            prev_summaries.append(f"- Task '{r.get('task', '')}': {r.get('summary', '')}")
        prev_context = "\n\nRELEVANT PREVIOUS RESULTS:\n" + "\n".join(prev_summaries)

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
