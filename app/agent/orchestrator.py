"""Orchestrator — top-level agent workflow.

Coordinates the full pipeline:
Request → Validation → Planning → Execution → Synthesis →
Reflection → Revision → DOCX Generation → Response
"""

import logging

from app.models import AgentResponse, PlannerOutput
from app.agent.planner import generate_plan
from app.agent.executor import execute_plan
from app.agent.synthesizer import synthesize
from app.agent.reflector import reflect_and_revise
from app.tools.document_tool import generate_docx
from app.tools.registry import register_tool
from app.tools.analysis_tool import execute_analysis
from app.tools.knowledge_tool import execute_knowledge

logger = logging.getLogger(__name__)

# Register tools on import
register_tool("analysis", execute_analysis)
register_tool("knowledge", execute_knowledge)


def run_agent(request: str) -> AgentResponse:
    """Execute the full autonomous agent pipeline.

    Args:
        request: The user's natural-language business request.

    Returns:
        AgentResponse with all pipeline results.
    """
    logger.info("=== Agent Pipeline Start ===")
    logger.info("Request: %s", request[:200])

    try:
        # --- Step 1: Dynamic Planning ---
        logger.info("Step 1: Generating dynamic plan...")
        plan: PlannerOutput = generate_plan(request)
        logger.info("Plan: %d tasks, type='%s'", len(plan.tasks), plan.document_type)

        # --- Step 2: Sequential Execution ---
        logger.info("Step 2: Executing %d tasks sequentially...", len(plan.tasks))
        execution_results = execute_plan(plan, request)

        # --- Step 3: Synthesis ---
        logger.info("Step 3: Synthesizing results into document draft...")
        draft = synthesize(
            request=request,
            goal=plan.goal,
            document_type=plan.document_type,
            assumptions=plan.assumptions,
            execution_results=execution_results,
        )

        # --- Step 4: Reflection / Self-Check ---
        logger.info("Step 4: Running reflection/self-check...")
        plan_task_dicts = [
            {"task": t.task, "purpose": t.purpose, "tool": t.tool}
            for t in plan.tasks
        ]
        reflection, final_draft = reflect_and_revise(
            request=request,
            goal=plan.goal,
            document_type=plan.document_type,
            assumptions=plan.assumptions,
            plan_tasks=plan_task_dicts,
            draft=draft,
        )

        # --- Step 5: DOCX Generation ---
        logger.info("Step 5: Generating DOCX...")
        title = _generate_title(plan.goal, plan.document_type)
        filename = generate_docx(
            title=title,
            document_type=plan.document_type,
            assumptions=plan.assumptions,
            content=final_draft,
            goal=plan.goal,
        )

        # --- Build Response ---
        plan_data = [
            {
                "id": t.id,
                "task": t.task,
                "purpose": t.purpose,
                "tool": t.tool,
                "status": t.status,
            }
            for t in plan.tasks
        ]

        exec_data = [
            {
                "task_id": r.get("task_id", 0),
                "task": r.get("task", ""),
                "tool": r.get("tool", ""),
                "status": r.get("status", ""),
                "summary": r.get("summary", ""),
            }
            for r in execution_results
        ]

        summary = _generate_summary(plan.goal, plan.document_type, len(plan.tasks), reflection.passed, reflection.error)

        response = AgentResponse(
            status="completed",
            goal=plan.goal,
            document_type=plan.document_type,
            assumptions=plan.assumptions,
            plan=plan_data,
            execution_results=exec_data,
            reflection={
                "passed": reflection.passed,
                "issues_found": reflection.issues_found,
                "improvements_applied": reflection.improvements_applied,
                "error": reflection.error,
            },
            summary=summary,
            document_filename=filename,
            document_url=f"/documents/{filename}",
        )

        logger.info("=== Agent Pipeline Complete: %s ===", filename)
        return response

    except Exception as e:
        logger.error("Agent pipeline failed: %s", e, exc_info=True)
        return AgentResponse(
            status="failed",
            error=f"Agent pipeline error: {str(e)[:200]}",
        )


def _generate_title(goal: str, document_type: str) -> str:
    """Generate a concise document title."""
    doc_type = document_type.replace("_", " ").title()
    # Truncate goal to first sentence or 80 chars
    short_goal = goal.split(".")[0][:80].strip()
    return f"{doc_type}: {short_goal}"


def _generate_summary(goal: str, document_type: str, num_tasks: int, reflection_passed: bool, reflection_error: bool) -> str:
    """Generate a concise pipeline summary."""
    if reflection_error:
        status = "was generated (quality check skipped due to error)"
    else:
        status = "passed quality check" if reflection_passed else "was revised after quality check"
    return (
        f"Successfully generated a {document_type.replace('_', ' ')} document. "
        f"Executed {num_tasks} tasks autonomously. "
        f"The document {status} and is ready for download."
    )
