"""Sequential task executor.

Routes tasks to the appropriate tool and carries context between steps.
"""

import logging

from app.models import PlannerOutput
from app.llm.client import call_llm
from app.prompts.executor_prompt import EXECUTOR_SYSTEM_PROMPT, build_executor_prompt

logger = logging.getLogger(__name__)


def execute_plan(plan: PlannerOutput, request: str) -> list[dict]:
    """Execute the plan by batching tasks into logical phases using a hybrid parallel/sequential model.

    Phase 1 & 2 (Discovery and Strategy) run concurrently since they are conceptual/framing.
    Phase 3 (Implementation/Roadmap) runs sequentially after, incorporating context from the first two.
    """
    from app.agent.state import PipelineState
    from concurrent.futures import ThreadPoolExecutor
    
    state = PipelineState(
        request=request,
        goal=plan.goal,
        document_type=plan.document_type,
        assumptions=plan.assumptions
    )
    
    results: list[dict] = []
    phases = _group_tasks_into_phases(plan.tasks)
    
    if not phases:
        return []

    def run_single_phase(phase_dict, prev_context):
        phase_name = phase_dict["name"]
        phase_tasks = phase_dict["tasks"]
        
        logger.info("Executing Phase: '%s' (%d tasks)", phase_name, len(phase_tasks))
        for task in phase_tasks:
            task.status = "running"
            
        system_prompt = EXECUTOR_SYSTEM_PROMPT + f"\n\nYou are operating in the {phase_name.upper()} execution phase. Thoroughly execute all tasks assigned to this phase as a cohesive block."
        task_dicts = [{"id": t.id, "task": t.task, "purpose": t.purpose, "tool": t.tool} for t in phase_tasks]
        user_prompt = build_executor_prompt(request, plan.goal, plan.document_type, plan.assumptions, task_dicts, prev_context)
        
        try:
            content = call_llm(system_prompt, user_prompt, temperature=0.5, max_tokens=4000, profile="deep_analysis")
            summary = content[:150].split("\n")[0] if content else f"Completed phase: {phase_name}"
            
            phase_results = []
            for i, task in enumerate(phase_tasks):
                task.status = "completed"
                phase_results.append({
                    "task_id": task.id,
                    "task": task.task,
                    "tool": task.tool,
                    "status": "completed",
                    "summary": f"Executed in phase: {phase_name}",
                    "content": content if i == 0 else ""  # Heavy text once per phase to avoid duplicating context for synthesizer
                })
            return {"name": phase_name, "summary": summary, "results": phase_results, "error": None}
        except Exception as e:
            logger.error("Phase '%s' failed: %s", phase_name, e)
            phase_results = []
            for task in phase_tasks:
                task.status = "failed"
                phase_results.append({
                    "task_id": task.id,
                    "task": task.task,
                    "tool": task.tool,
                    "status": "failed",
                    "summary": f"Phase failed: {str(e)[:100]}",
                    "content": "",
                })
            return {"name": phase_name, "summary": f"Failed: {str(e)[:50]}", "results": phase_results, "error": e}

    # Hybrid Concurrency Strategy:
    # If 3 or more phases exist, run Phase 1 & 2 in parallel.
    # Run Phase 3 sequentially with the context derived from Phase 1 & 2.
    if len(phases) >= 3:
        logger.info("Hybrid Concurrency Mode: Running Phase 1 & 2 in parallel...")
        parallel_phases = [phases[0], phases[1]]
        with ThreadPoolExecutor(max_workers=2) as executor:
            futures = [
                executor.submit(run_single_phase, p, "")
                for p in parallel_phases
            ]
            phase_outputs = [f.result() for f in futures]
            
        # Collect outcomes
        for out in phase_outputs:
            state.phase_summaries.append({
                "task": out["name"],
                "summary": out["summary"]
            })
            results.extend(out["results"])
            
        # Sequentially run the remainder (e.g. Implementation & Deliverables)
        logger.info("Hybrid Concurrency Mode: Running remaining phases sequentially...")
        for p in phases[2:]:
            out = run_single_phase(p, state.get_summary_text())
            state.phase_summaries.append({
                "task": out["name"],
                "summary": out["summary"]
            })
            results.extend(out["results"])
    else:
        # Standard sequential run for smaller plans
        logger.info("Fewer than 3 phases. Running sequentially...")
        for p in phases:
            out = run_single_phase(p, state.get_summary_text())
            state.phase_summaries.append({
                "task": out["name"],
                "summary": out["summary"]
            })
            results.extend(out["results"])

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
