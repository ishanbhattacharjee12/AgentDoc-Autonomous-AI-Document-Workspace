"""Knowledge tool for domain context and background knowledge.

Used for: domain context, business/technical considerations,
common practices, relevant background knowledge.

No live internet access. Never fabricates citations.
Clearly distinguishes assumptions from verified facts.
"""

import logging

from app.llm.client import call_llm
from app.prompts.executor_prompt import EXECUTOR_SYSTEM_PROMPT, build_executor_prompt

logger = logging.getLogger(__name__)


def execute_knowledge(
    request: str,
    goal: str,
    document_type: str,
    assumptions: list[str],
    task: dict,
    previous_results: list[dict],
) -> dict:
    """Execute a knowledge-retrieval task using the LLM.

    Returns a dict with task_id, task, tool, status, summary, and content.
    """
    logger.info("Knowledge tool executing task %d: %s", task.get("id", 0), task.get("task", ""))

    system_prompt = EXECUTOR_SYSTEM_PROMPT + (
        "\n\nYou are operating as the KNOWLEDGE tool. "
        "Focus on providing domain context, industry best practices, "
        "technical considerations, and relevant background knowledge. "
        "Do NOT fabricate citations or fake data sources. "
        "Clearly distinguish between established practices (common knowledge) "
        "and assumptions you are making. "
        "Be practical and actionable."
    )

    user_prompt = build_executor_prompt(
        request, goal, document_type, assumptions, task, previous_results
    )

    try:
        content = call_llm(system_prompt, user_prompt, temperature=0.5, max_tokens=3000)
        summary = content[:200].split("\n")[0] if content else "Knowledge retrieved."

        return {
            "task_id": task.get("id", 0),
            "task": task.get("task", ""),
            "tool": "knowledge",
            "status": "completed",
            "summary": summary,
            "content": content,
        }
    except Exception as e:
        logger.error("Knowledge tool failed for task %d: %s", task.get("id", 0), e)
        return {
            "task_id": task.get("id", 0),
            "task": task.get("task", ""),
            "tool": "knowledge",
            "status": "failed",
            "summary": f"Knowledge retrieval failed: {str(e)[:100]}",
            "content": "",
        }
