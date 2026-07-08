"""Autonomous planner module.

Dynamically generates a task plan based on the user's request.
Uses LLM to interpret goals, identify assumptions, and decompose work.
Includes validation, repair retry, and deterministic fallback.
"""

import logging

from pydantic import ValidationError

from app.llm.client import call_llm_json
from app.models import PlannerOutput, TaskPlan
from app.prompts.planner_prompt import PLANNER_SYSTEM_PROMPT, PLANNER_USER_PROMPT_TEMPLATE

logger = logging.getLogger(__name__)


def generate_plan(request: str) -> PlannerOutput:
    """Generate a dynamic execution plan for the given request.

    Attempts LLM-based planning with structured output.
    Falls back to a deterministic plan on repeated failure.
    """
    user_prompt = PLANNER_USER_PROMPT_TEMPLATE.format(request=request)

    try:
        raw = call_llm_json(PLANNER_SYSTEM_PROMPT, user_prompt, temperature=0.4)
        plan = PlannerOutput(**raw)

        # Validate tool names
        allowed_tools = {"analysis", "knowledge", "document"}
        for task in plan.tasks:
            if task.tool not in allowed_tools:
                logger.warning("Task %d has unknown tool '%s', defaulting to 'analysis'", task.id, task.tool)
                task.tool = "analysis"

        if not plan.tasks:
            logger.warning("Planner returned empty task list, using fallback.")
            return _fallback_plan(request)

        logger.info("Plan generated: %d tasks for document type '%s'", len(plan.tasks), plan.document_type)
        return plan

    except (RuntimeError, ValidationError, KeyError, TypeError) as e:
        logger.error("Planning failed: %s. Using fallback plan.", e)
        return _fallback_plan(request)


def _fallback_plan(request: str) -> PlannerOutput:
    """Generate a safe deterministic fallback plan.

    Used when LLM planning fails after retries.
    """
    logger.info("Generating deterministic fallback plan.")
    return PlannerOutput(
        goal=f"Address the following request: {request[:200]}",
        document_type="business_document",
        assumptions=[
            "Using fallback plan due to planning failure",
            "General business document structure applied",
            "Specific details will be inferred from the request",
        ],
        tasks=[
            TaskPlan(
                id=1,
                task="Analyze the core request and identify key requirements",
                purpose="Understand what the user needs",
                tool="analysis",
                depends_on=[],
            ),
            TaskPlan(
                id=2,
                task="Gather relevant domain knowledge and best practices",
                purpose="Provide context and substance",
                tool="knowledge",
                depends_on=[1],
            ),
            TaskPlan(
                id=3,
                task="Structure findings into document sections",
                purpose="Organize content for the final document",
                tool="analysis",
                depends_on=[1, 2],
            ),
            TaskPlan(
                id=4,
                task="Define actionable recommendations and next steps",
                purpose="Provide practical value to the reader",
                tool="analysis",
                depends_on=[3],
            ),
        ],
    )
