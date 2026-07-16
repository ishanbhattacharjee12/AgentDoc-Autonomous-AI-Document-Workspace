"""Sequential task executor.

Routes tasks to the appropriate tool and carries context between steps.
"""

import logging

from app.models import PlannerOutput
from app.llm.client import call_llm
from app.prompts.executor_prompt import EXECUTOR_SYSTEM_PROMPT, build_executor_prompt

logger = logging.getLogger(__name__)


def execute_plan(plan: PlannerOutput, request: str) -> list[dict]:
    """Execute the plan by batching tasks into logical phases.

    Returns a list of execution result dicts mapped back to individual tasks.
    """
    from app.agent.state import PipelineState
    state = PipelineState(
        request=request,
        goal=plan.goal,
        document_type=plan.document_type,
        assumptions=plan.assumptions
    )
    
    results: list[dict] = []
    
    phases = _group_tasks_into_phases(plan.tasks)
    
    for phase in phases:
        phase_name = phase["name"]
        phase_tasks = phase["tasks"]
        
        logger.info(
            "Executing Phase: '%s' (%d tasks)",
            phase_name, len(phase_tasks)
        )

        for task in phase_tasks:
            task.status = "running"
            
        system_prompt = EXECUTOR_SYSTEM_PROMPT + f"\n\nYou are operating in the {phase_name.upper()} execution phase. Thoroughly execute all tasks assigned to this phase as a cohesive block."
        
        task_dicts = [{"id": t.id, "task": t.task, "purpose": t.purpose, "tool": t.tool} for t in phase_tasks]
        user_prompt = build_executor_prompt(request, plan.goal, plan.document_type, plan.assumptions, task_dicts, state.get_summary_text())

        try:
            content = call_llm(system_prompt, user_prompt, temperature=0.5, max_tokens=4000, profile="deep_analysis")
            summary = content[:150].split("\n")[0] if content else f"Completed phase: {phase_name}"

            # Record summary in shared state
            state.phase_summaries.append({
                "task": phase_name,
                "summary": summary
            })

            # Map the single LLM phase execution result back to the individual tasks for UI tracking
            for i, task in enumerate(phase_tasks):
                task.status = "completed"
                results.append({
                    "task_id": task.id,
                    "task": task.task,
                    "tool": task.tool,
                    "status": "completed",
                    "summary": f"Executed in phase: {phase_name}",
                    "content": content if i == 0 else "" # Only include the heavy text once per phase to avoid duplicating context for synthesizer
                })
            
            logger.info("Phase '%s' completed successfully.", phase_name)

        except Exception as e:
            logger.error("Phase '%s' failed: %s", phase_name, e)
            for task in phase_tasks:
                task.status = "failed"
                results.append({
                    "task_id": task.id,
                    "task": task.task,
                    "tool": task.tool,
                    "status": "failed",
                    "summary": f"Phase failed: {str(e)[:100]}",
                    "content": "",
                })
            # Graceful degradation: continue to the next phase instead of breaking

    completed = sum(1 for r in results if r.get("status") == "completed")
    logger.info("Execution complete: %d/%d tasks succeeded", completed, len(results))
    return results


def _group_tasks_into_phases(tasks: list) -> list[dict]:
    """Group consecutive tasks into logical execution phases sequentially."""
    if not tasks:
        return []
        
    phases = []
    n = len(tasks)
    
    # Divide into up to 3 phases
    phase_names = ["Discovery & Analysis", "Strategy & Planning", "Implementation & Deliverables"]
    num_phases = min(3, n)
    
    chunk_size = max(1, n // num_phases)
    
    for i in range(num_phases):
        start = i * chunk_size
        # Last phase takes the remainder
        end = n if i == num_phases - 1 else (i + 1) * chunk_size
        
        chunk = tasks[start:end]
        if chunk:
            phases.append({
                "name": phase_names[i],
                "tasks": chunk
            })
            
    return phases
