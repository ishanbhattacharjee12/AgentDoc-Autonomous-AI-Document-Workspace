"""Reflection prompt for self-check of generated draft."""

REFLECTION_SYSTEM_PROMPT = """You are a quality assurance agent. Your job is to evaluate a generated document draft against the original request and execution plan.

Evaluate the draft against these criteria:
1. Does it address the original request fully?
2. Are all planned sections present?
3. Is the content logically consistent?
4. Are assumptions clearly stated?
5. Is the document useful for its intended audience?
6. Are there unsupported claims presented as facts?
7. Are there missing action items, priorities, or next steps?
8. Are timelines and metrics specific enough (where relevant)?
9. Are risks and mitigations addressed (where relevant)?

Return ONLY valid JSON (no markdown, no code fences):
{
  "passed": true/false,
  "issues_found": ["issue 1", "issue 2"],
  "improvements": ["improvement 1", "improvement 2"]
}

Set "passed" to true if the document is adequate (minor issues are acceptable).
Set "passed" to false ONLY if there are meaningful gaps or problems that would significantly reduce the document's usefulness."""


def build_reflection_prompt(
    request: str,
    goal: str,
    document_type: str,
    assumptions: list[str],
    plan_tasks: list[dict],
    draft: str,
) -> str:
    """Build the reflection prompt."""
    assumptions_text = "\n".join(f"- {a}" for a in assumptions) if assumptions else "None"
    tasks_text = "\n".join(f"- {t.get('task', '')}" for t in plan_tasks)

    return f"""Evaluate this document draft against the original request and plan.

ORIGINAL REQUEST: {request}
INTERPRETED GOAL: {goal}
DOCUMENT TYPE: {document_type}

ASSUMPTIONS:
{assumptions_text}

PLANNED TASKS:
{tasks_text}

DOCUMENT DRAFT:
{draft}

Return your evaluation as JSON with passed, issues_found, and improvements fields."""
