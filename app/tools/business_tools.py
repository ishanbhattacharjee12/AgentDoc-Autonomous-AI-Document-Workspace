"""Business tools for specialized structured reasoning."""

import logging
from app.llm.client import call_llm
from app.prompts.executor_prompt import EXECUTOR_SYSTEM_PROMPT, build_executor_prompt

logger = logging.getLogger(__name__)

def _execute_business_tool(tool_name: str, instruction: str, request: str, goal: str, document_type: str, assumptions: list[str], task: dict, previous_results: list[dict]) -> dict:
    """Generic executor for business tools."""
    logger.info("%s tool executing task %d: %s", tool_name.capitalize(), task.get("id", 0), task.get("task", ""))

    system_prompt = EXECUTOR_SYSTEM_PROMPT + (
        f"\n\nYou are operating as the {tool_name.upper()} tool. {instruction} "
        "Be thorough, specific, and format your output clearly."
    )

    user_prompt = build_executor_prompt(
        request, goal, document_type, assumptions, task, previous_results
    )

    try:
        content = call_llm(system_prompt, user_prompt, temperature=0.5, max_tokens=3000)
        summary = content[:200].split("\n")[0] if content else f"{tool_name.replace('_', ' ').capitalize()} completed."

        return {
            "task_id": task.get("id", 0),
            "task": task.get("task", ""),
            "tool": tool_name,
            "status": "completed",
            "summary": summary,
            "content": content,
        }
    except Exception as e:
        logger.error("%s tool failed for task %d: %s", tool_name, task.get("id", 0), e)
        return {
            "task_id": task.get("id", 0),
            "task": task.get("task", ""),
            "tool": tool_name,
            "status": "failed",
            "summary": f"{tool_name.replace('_', ' ').capitalize()} failed: {str(e)[:100]}",
            "content": "",
        }


def execute_requirements_analysis(*args, **kwargs):
    return _execute_business_tool("requirements_analysis", "Focus on defining functional and non-functional requirements, use cases, and success criteria.", *args, **kwargs)

def execute_stakeholder_analysis(*args, **kwargs):
    return _execute_business_tool("stakeholder_analysis", "Focus on identifying target audiences, roles, communication needs, and impacts.", *args, **kwargs)

def execute_compliance_review(*args, **kwargs):
    return _execute_business_tool("compliance_review", "Focus on identifying security, legal, regulatory, or industry compliance constraints.", *args, **kwargs)

def execute_cost_benefit_analysis(*args, **kwargs):
    return _execute_business_tool("cost_benefit_analysis", "Focus on evaluating budget, timeline, ROI, resource tradeoffs, and costs vs benefits.", *args, **kwargs)

def execute_priority_matrix(*args, **kwargs):
    return _execute_business_tool("priority_matrix", "Focus on categorizing actions and features by impact, urgency, and feasibility using a priority matrix format.", *args, **kwargs)
