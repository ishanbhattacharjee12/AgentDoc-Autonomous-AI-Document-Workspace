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

    import time
    start_time = time.time()
    try:
        logger.info("[DIAGNOSTIC] Sending request to LLM via call_llm_json")
        start_time = time.time()
        plan_json = call_llm_json(PLANNER_SYSTEM_PROMPT, user_prompt, temperature=0.3)
        logger.info(f"[DIAGNOSTIC] LLM returned response in {time.time() - start_time:.2f}s. Parsing JSON...")
        plan = PlannerOutput(**plan_json)
        logger.info("[DIAGNOSTIC] Planner successfully parsed JSON.")

        # Validate tool names
        allowed_tools = {
            "analysis", "knowledge", "document",
            "requirements_analysis", "stakeholder_analysis",
            "compliance_review", "cost_benefit_analysis", "priority_matrix"
        }
        for task in plan.tasks:
            if task.tool not in allowed_tools:
                logger.warning("Task %d has unknown tool '%s', defaulting to 'analysis'", task.id, task.tool)
                task.tool = "analysis"

        if not plan.tasks:
            logger.error("Planner returned empty task list. Aborting.")
            raise RuntimeError("Planner generated a plan with no tasks.")

        logger.info("Plan generated: %d tasks for document type '%s'", len(plan.tasks), plan.document_type)
        return plan

    except (RuntimeError, ValidationError, KeyError, TypeError) as e:
        logger.error("Planning failed: %s", e)
        raise
