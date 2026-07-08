"""Analysis tool for structured analytical reasoning.

Used for: requirement analysis, ambiguity resolution, constraints,
assumptions, prioritization, tradeoffs, structured reasoning.
"""

import logging

from app.llm.client import call_llm
from app.prompts.executor_prompt import EXECUTOR_SYSTEM_PROMPT, build_executor_prompt

logger = logging.getLogger(__name__)


def execute_analysis(
    request: str,
    goal: str,
    document_type: str,
    assumptions: list[str],
    task: dict,
    previous_results: list[dict],
) -> dict:
    """Execute an analysis task using the LLM.

    Returns a dict with task_id, task, tool, status, summary, and content.
    """
    logger.info("Analysis tool executing task %d: %s", task.get("id", 0), task.get("task", ""))

    system_prompt = EXECUTOR_SYSTEM_PROMPT + (
        "\n\nYou are operating as the ANALYSIS tool. "
        "Focus on analytical reasoning: requirements analysis, ambiguity resolution, "
        "constraint identification, prioritization, tradeoff analysis, and structured reasoning. "
        "Be thorough and specific."
    )

    user_prompt = build_executor_prompt(
        request, goal, document_type, assumptions, task, previous_results
    )

    try:
        content = call_llm(system_prompt, user_prompt, temperature=0.5, max_tokens=3000)
        # Generate a concise summary (first 200 chars or first paragraph)
        summary = content[:200].split("\n")[0] if content else "Analysis completed."

        return {
            "task_id": task.get("id", 0),
            "task": task.get("task", ""),
            "tool": "analysis",
            "status": "completed",
            "summary": summary,
            "content": content,
        }
    except Exception as e:
        logger.error("Analysis tool failed for task %d: %s", task.get("id", 0), e)
        return {
            "task_id": task.get("id", 0),
            "task": task.get("task", ""),
            "tool": "analysis",
            "status": "failed",
            "summary": f"Analysis failed: {str(e)[:100]}",
            "content": "",
        }
