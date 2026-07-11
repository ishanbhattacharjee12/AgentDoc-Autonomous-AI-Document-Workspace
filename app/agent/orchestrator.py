"""Orchestrator — top-level agent workflow.

Coordinates the full pipeline:
Request → Validation → Planning → Execution → Synthesis →
Reflection → Revision → DOCX Generation → Response
"""

import logging

from app.models import AgentResponse, PlannerOutput, PlanEditRequest, TaskPlan
from app.agent.planner import generate_plan
from app.agent.executor import execute_plan
from app.agent.synthesizer import synthesize
from app.agent.reflector import reflect_and_revise
from app.tools.document_tool import generate_docx
from app.tools.registry import register_tool
from app.tools.analysis_tool import execute_analysis
from app.tools.knowledge_tool import execute_knowledge
from app.tools.business_tools import (
    execute_requirements_analysis,
    execute_stakeholder_analysis,
    execute_compliance_review,
    execute_cost_benefit_analysis,
    execute_priority_matrix
)

logger = logging.getLogger(__name__)

# Register tools on import
register_tool("analysis", execute_analysis)
register_tool("knowledge", execute_knowledge)
register_tool("requirements_analysis", execute_requirements_analysis)
register_tool("stakeholder_analysis", execute_stakeholder_analysis)
register_tool("compliance_review", execute_compliance_review)
register_tool("cost_benefit_analysis", execute_cost_benefit_analysis)
register_tool("priority_matrix", execute_priority_matrix)


def run_agent(request: str, progress_cb=None, require_review: bool = False, format: str = "docx") -> AgentResponse:
    """Execute the full autonomous agent pipeline, optionally pausing after planning.

    Args:
        request: The user's natural-language business request.
        progress_cb: Optional callback for streaming progress.
        require_review: Whether to pause after planning for human-in-the-loop review.
        format: The export format for the generated document.

    Returns:
        AgentResponse with all pipeline results.
    """
    logger.info("=== Agent Pipeline Start ===")
    logger.info("Request: %s", request[:200])

    import time
    from app.llm.client import get_llm_call_count, reset_llm_call_count
    
    reset_llm_call_count()
    start_time = time.time()

    try:
        # --- Step 1: Dynamic Planning ---
        if progress_cb: progress_cb("Planning")
        logger.info("Step 1: Generating dynamic plan...")
        plan: PlannerOutput = generate_plan(request)
        logger.info("Plan: %d tasks, type='%s'", len(plan.tasks), plan.document_type)

        plan_data = [
            {
                "id": t.id,
                "task": t.task,
                "purpose": t.purpose,
                "tool": t.tool,
                "status": t.status,
                "depends_on": getattr(t, "depends_on", []),
            }
            for t in plan.tasks
        ]

        if require_review:
            logger.info("Pausing for human-in-the-loop review...")
            return AgentResponse(
                status="requires_review",
                goal=plan.goal,
                document_type=plan.document_type,
                confidence=getattr(plan, 'confidence', ''),
                confidence_reason=getattr(plan, 'confidence_reason', ''),
                complexity=getattr(plan, 'complexity', ''),
                complexity_reason=getattr(plan, 'complexity_reason', ''),
                reading_time=getattr(plan, 'reading_time', ''),
                implementation_effort=getattr(plan, 'implementation_effort', ''),
                planning_summary=getattr(plan, 'planning_summary', ''),
                assumptions=plan.assumptions,
                plan=plan_data,
                total_execution_time=round(time.time() - start_time, 2),
                llm_call_count=get_llm_call_count()
            )

        # --- Step 2: Sequential Execution ---
        if progress_cb: progress_cb(f"Executing {len(plan.tasks)} Tasks")
        logger.info("Step 2: Executing %d tasks sequentially...", len(plan.tasks))
        execution_results = execute_plan(plan, request)

        # --- Step 3: Synthesis ---
        if progress_cb: progress_cb("Synthesizing")
        logger.info("Step 3: Synthesizing results into document draft...")
        draft = synthesize(
            request=request,
            goal=plan.goal,
            document_type=plan.document_type,
            assumptions=plan.assumptions,
            execution_results=execution_results,
        )

        # --- Step 4: Reflection / Self-Check ---
        if progress_cb: progress_cb("Reflecting")
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
        
        revision_count = 1 if len(reflection.improvements_applied) > 0 else 0

        # --- Step 5: DOCX Generation ---
        if progress_cb: progress_cb("Generating Document")
        logger.info("Step 5: Generating DOCX...")
        title = _generate_title(plan.goal, plan.document_type)
        filename = generate_docx(
            title=title,
            document_type=plan.document_type,
            assumptions=plan.assumptions,
            content=final_draft,
            goal=plan.goal,
            format_ext=format
        )

        end_time = time.time()
        total_time = round(end_time - start_time, 2)
        llm_calls = get_llm_call_count()

        # --- Build Response ---
        # (plan_data already built above)

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
            confidence=getattr(plan, 'confidence', ''),
            confidence_reason=getattr(plan, 'confidence_reason', ''),
            complexity=getattr(plan, 'complexity', ''),
            complexity_reason=getattr(plan, 'complexity_reason', ''),
            reading_time=getattr(plan, 'reading_time', ''),
            implementation_effort=getattr(plan, 'implementation_effort', ''),
            planning_summary=getattr(plan, 'planning_summary', ''),
            assumptions=plan.assumptions,
            plan=plan_data,
            execution_results=exec_data,
            reflection={
                "passed": reflection.passed,
                "grade": getattr(reflection, 'grade', 'Satisfactory'),
                "reason": getattr(reflection, 'reason', ''),
                "issues_found": reflection.issues_found,
                "improvements_applied": reflection.improvements_applied,
                "error": reflection.error,
            },
            summary=summary,
            document_filename=filename,
            document_url=f"/documents/{filename}",
            total_execution_time=total_time,
            llm_call_count=llm_calls,
            revision_count=revision_count
        )

        logger.info("=== Agent Pipeline Complete: %s ===", filename)
        if progress_cb: progress_cb("Complete")
        return response

    except Exception as e:
        logger.error("Agent pipeline failed: %s", e, exc_info=True)
        end_time = time.time()
        return AgentResponse(
            status="failed",
            error=f"Agent pipeline error: {str(e)[:200]}",
            total_execution_time=round(end_time - start_time, 2),
            llm_call_count=get_llm_call_count(),
            revision_count=0
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


def execute_plan_only(edit_req: PlanEditRequest, progress_cb=None) -> AgentResponse:
    """Resume execution from an approved/edited plan."""
    logger.info("=== Agent Pipeline Resume ===")
    
    import time
    from app.llm.client import get_llm_call_count, reset_llm_call_count
    
    reset_llm_call_count()
    start_time = time.time()
    
    request = edit_req.request
    plan = edit_req.planner_output
    format_req = edit_req.format

    try:
        # --- Step 2: Sequential Execution ---
        if progress_cb: progress_cb(f"Executing {len(plan.tasks)} Tasks")
        logger.info("Step 2: Executing %d tasks sequentially...", len(plan.tasks))
        execution_results = execute_plan(plan, request)

        # --- Step 3: Synthesis ---
        if progress_cb: progress_cb("Synthesizing")
        logger.info("Step 3: Synthesizing results into document draft...")
        draft = synthesize(
            request=request,
            goal=plan.goal,
            document_type=plan.document_type,
            assumptions=plan.assumptions,
            execution_results=execution_results,
        )

        # --- Step 4: Reflection / Self-Check ---
        if progress_cb: progress_cb("Reflecting")
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
        
        revision_count = 1 if len(reflection.improvements_applied) > 0 else 0

        # --- Step 5: Document Generation ---
        if progress_cb: progress_cb(f"Generating Document ({format_req.upper()})")
        logger.info("Step 5: Generating document...")
        title = _generate_title(plan.goal, plan.document_type)
        filename = generate_docx(
            title=title,
            document_type=plan.document_type,
            assumptions=plan.assumptions,
            content=final_draft,
            goal=plan.goal,
            format_ext=format_req
        )

        end_time = time.time()
        total_time = round(end_time - start_time, 2)
        llm_calls = get_llm_call_count()

        # --- Build Response ---
        plan_data = [
            {
                "id": t.id,
                "task": t.task,
                "purpose": t.purpose,
                "tool": t.tool,
                "status": t.status,
                "depends_on": getattr(t, "depends_on", []),
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
            confidence=getattr(plan, 'confidence', ''),
            confidence_reason=getattr(plan, 'confidence_reason', ''),
            complexity=getattr(plan, 'complexity', ''),
            complexity_reason=getattr(plan, 'complexity_reason', ''),
            reading_time=getattr(plan, 'reading_time', ''),
            implementation_effort=getattr(plan, 'implementation_effort', ''),
            planning_summary=getattr(plan, 'planning_summary', ''),
            assumptions=plan.assumptions,
            plan=plan_data,
            execution_results=exec_data,
            reflection={
                "passed": reflection.passed,
                "grade": getattr(reflection, 'grade', 'Satisfactory'),
                "reason": getattr(reflection, 'reason', ''),
                "issues_found": reflection.issues_found,
                "improvements_applied": reflection.improvements_applied,
                "error": reflection.error,
            },
            summary=summary,
            document_filename=filename,
            document_url=f"/documents/{filename}",
            total_execution_time=total_time,
            llm_call_count=llm_calls,
            revision_count=revision_count
        )

        logger.info("=== Agent Pipeline Complete: %s ===", filename)
        if progress_cb: progress_cb("Complete")
        return response

    except Exception as e:
        logger.error("Agent pipeline failed: %s", e, exc_info=True)
        end_time = time.time()
        return AgentResponse(
            status="failed",
            error=f"Agent pipeline error: {str(e)[:200]}",
            total_execution_time=round(end_time - start_time, 2),
            llm_call_count=get_llm_call_count(),
            revision_count=0
        )
