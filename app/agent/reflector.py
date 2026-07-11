"""Reflector module — self-check and one-pass revision.

Evaluates the draft against the original request and plan.
Triggers exactly one revision pass if meaningful issues are found.
"""

import logging

from app.llm.client import call_llm, call_llm_json
from app.models import ReflectionResult
from app.prompts.reflection_prompt import REFLECTION_SYSTEM_PROMPT, build_reflection_prompt
from app.prompts.revision_prompt import REVISION_SYSTEM_PROMPT, build_revision_prompt

logger = logging.getLogger(__name__)


def reflect_and_revise(
    request: str,
    goal: str,
    document_type: str,
    assumptions: list[str],
    plan_tasks: list[dict],
    draft: str,
) -> tuple[ReflectionResult, str]:
    """Run reflection on the draft and revise once if needed.

    Returns (reflection_result, final_draft).
    The final_draft may be the original or a revised version.
    """
    logger.info("Running reflection/self-check on draft (%d chars)", len(draft))

    # --- Reflection ---
    reflection = _run_reflection(request, goal, document_type, assumptions, plan_tasks, draft)

    # --- Revision (at most one pass) ---
    if not reflection.passed and (reflection.issues_found or reflection.improvements_applied):
        logger.info(
            "Reflection found %d issues. Performing one revision pass.",
            len(reflection.issues_found)
        )
        revised_draft = _run_revision(draft, reflection.issues_found, reflection.improvements_applied)
        if revised_draft and len(revised_draft) > len(draft) * 0.3:
            logger.info("Revision completed: %d → %d chars", len(draft), len(revised_draft))
            return reflection, revised_draft
        else:
            logger.warning("Revision produced insufficient content, keeping original draft.")

    logger.info("Reflection passed or no revision needed.")
    return reflection, draft


def _run_reflection(
    request: str,
    goal: str,
    document_type: str,
    assumptions: list[str],
    plan_tasks: list[dict],
    draft: str,
) -> ReflectionResult:
    """Execute the reflection/self-check."""
    user_prompt = build_reflection_prompt(
        request, goal, document_type, assumptions, plan_tasks, draft
    )

    try:
        raw = call_llm_json(REFLECTION_SYSTEM_PROMPT, user_prompt, temperature=0.3, max_tokens=500)
        grade = raw.get("grade", "Satisfactory")
        # Consider it "passed" if it doesn't strictly need revision
        passed = grade not in ["Needs Revision", "Poor"]
        
        result = ReflectionResult(
            passed=passed,
            grade=grade,
            reason=raw.get("reason", ""),
            issues_found=raw.get("issues_found", []),
            improvements_applied=raw.get("improvements", raw.get("improvements_applied", [])),
            error=False
        )
        logger.info("Reflection result: grade=%s, passed=%s, issues=%d", result.grade, result.passed, len(result.issues_found))
        return result

    except Exception as e:
        logger.error("Reflection failed: %s. Defaulting to Acceptable.", e)
        return ReflectionResult(
            passed=True, # Fail open gracefully
            grade="Provider Error",
            reason=f"Reflection skipped due to error: {str(e)[:80]}",
            issues_found=[],
            improvements_applied=[],
            error=True
        )


def _run_revision(
    draft: str,
    issues: list[str],
    improvements: list[str],
) -> str:
    """Execute one revision pass on the draft."""
    user_prompt = build_revision_prompt(draft, issues, improvements)

    try:
        revised = call_llm(
            REVISION_SYSTEM_PROMPT,
            user_prompt,
            temperature=0.4,
            max_tokens=None, # type: ignore
        )
        return revised

    except Exception as e:
        logger.error("Revision failed: %s. Keeping original draft.", e)
        return ""
