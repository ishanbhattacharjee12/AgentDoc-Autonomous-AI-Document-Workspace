"""Sequential task executor.

Routes tasks to the appropriate tool and carries context between steps.
"""

import logging

from app.models import PlannerOutput
from app.tools.registry import get_tool

logger = logging.getLogger(__name__)


def execute_plan(plan: PlannerOutput, request: str) -> list[dict]:
    """Execute all tasks in the plan sequentially.

    Each task receives the original request context plus relevant
    results from previous tasks for continuity.

    Returns a list of execution result dicts.
    """
    results: list[dict] = []

    for task in plan.tasks:
        task_dict = {
            "id": task.id,
            "task": task.task,
            "purpose": task.purpose,
            "tool": task.tool,
        }

        logger.info(
            "Executing task %d/%d: '%s' (tool: %s)",
            task.id, len(plan.tasks), task.task, task.tool
        )

        # Update status to running
        task.status = "running"

        try:
            tool_func = get_tool(task.tool)
            actual_tool = task.tool

            # Check if we fell back to a different tool
            if not _is_known_tool(task.tool):
                actual_tool = "analysis"
                task.status = "recovered"
                logger.info("Task %d recovered: unknown tool '%s' → 'analysis'", task.id, task.tool)

            result = tool_func(
                request=request,
                goal=plan.goal,
                document_type=plan.document_type,
                assumptions=plan.assumptions,
                task=task_dict,
                previous_results=results,
            )

            # Update status
            if task.status != "recovered":
                task.status = result.get("status", "completed")
            result["tool"] = actual_tool if task.status == "recovered" else result.get("tool", task.tool)

            results.append(result)
            logger.info("Task %d completed: %s", task.id, result.get("summary", "")[:100])

        except Exception as e:
            logger.error("Task %d failed: %s", task.id, e)
            task.status = "failed"
            results.append({
                "task_id": task.id,
                "task": task.task,
                "tool": task.tool,
                "status": "failed",
                "summary": f"Task failed: {str(e)[:100]}",
                "content": "",
            })

    completed = sum(1 for r in results if r.get("status") == "completed")
    logger.info("Execution complete: %d/%d tasks succeeded", completed, len(results))
    return results


def _is_known_tool(name: str) -> bool:
    """Check if tool name is in the known set."""
    return name in {"analysis", "knowledge", "document"}
