"""Reflector module — self-check and one-pass revision.

Evaluates the draft against the original request and plan.
Triggers exactly one revision pass if meaningful issues are found.
Supports heuristic skips, resilient line-based grade parsing, and soft-fail safety.
"""

import logging
import re
import json
from typing import Tuple, Dict, Any

from app.llm.client import call_llm
from app.models import ReflectionResult, PlannerOutput
from app.prompts.reflection_prompt import REFLECTION_SYSTEM_PROMPT, build_reflection_prompt
from app.prompts.revision_prompt import REVISION_SYSTEM_PROMPT, build_revision_prompt

logger = logging.getLogger(__name__)


def should_skip_reflection(plan: PlannerOutput, draft: str) -> bool:
    """Determine if reflection call can be skipped entirely based on heuristics."""
    # 1. High confidence plan
    if getattr(plan, "confidence", "Low") != "High":
        return False
    # 2. Moderate or Simple complexity
    if getattr(plan, "complexity", "Moderate") not in ("Simple", "Moderate"):
        return False
    # 3. Simple length sanity check
    if not draft or len(draft) < 300:
        return False
    # 4. Check for obvious structure
    if "##" not in draft:
        return False
    return True


def parse_reflection_response(text: str) -> Dict[str, Any]:
    """Resiliently parse reflection output as JSON or line-based grade markers."""
    # Attempt 1: Standard JSON parsing
    try:
        from app.llm.client import clean_json_response
        cleaned = clean_json_response(text)
        return json.loads(cleaned)
    except Exception:
        pass

    # Attempt 2: Line-based parsing fallback
    logger.info("JSON parsing failed for reflection. Falling back to line-based parsing.")
    result = {
        "grade": "Satisfactory",
        "reason": "",
        "issues_found": [],
        "improvements": []
    }

    lines = text.split("\n")
    current_section = None

    for line in lines:
        line_strip = line.strip()
        if not line_strip:
            continue

        # Check for Grade
        grade_match = re.search(r'grade:\s*([a-zA-Z\s]+)', line_strip, re.IGNORECASE)
        if grade_match:
            raw_grade = grade_match.group(1).strip().title()
            # Normalize grade to accepted types
            valid_grades = ["Excellent", "Good", "Satisfactory", "Needs Revision", "Poor"]
            for g in valid_grades:
                if g.lower() in raw_grade.lower():
                    result["grade"] = g
                    break
            continue

        # Check for Reason
        reason_match = re.search(r'reason:\s*(.+)', line_strip, re.IGNORECASE)
        if reason_match:
            result["reason"] = reason_match.group(1).strip()
            continue

        # Detect section markers
        line_lower = line_strip.lower()
        if any(x in line_lower for x in ["issues found:", "issues:", "problems:"]):
            current_section = "issues"
            continue
        elif any(x in line_lower for x in ["improvements:", "suggestions:", "improvements applied:"]):
            current_section = "improvements"
            continue

        # Extract list items
        if line_strip.startswith("-") or line_strip.startswith("*") or (line_strip[0].isdigit() and len(line_strip) > 2 and line_strip[1] == "."):
            item = re.sub(r'^[-*\d.]+\s*', '', line_strip).strip()
            if current_section == "issues":
                result["issues_found"].append(item)
            elif current_section == "improvements":
                result["improvements"].append(item)

    return result


def reflect_and_revise(
    request: str,
    goal: str,
    document_type: str,
    assumptions: list[str],
    plan_tasks: list[dict],
    draft: str,
    plan_object: PlannerOutput = None,
) -> tuple[ReflectionResult, str]:
    """Run reflection on the draft and revise once if needed.

    Supports heuristic skips, line-based parsing, and soft-fail.
    """
    # Check heuristic skip first
    if plan_object and should_skip_reflection(plan_object, draft):
        logger.info("Heuristic quality metrics satisfied. Skipping reflection call.")
        skipped_result = ReflectionResult(
            passed=True,
            grade="Excellent (Skipped)",
            reason="Heuristic checks passed. Reflection skipped to save latency.",
            issues_found=[],
            improvements_applied=[],
            error=False
        )
        return skipped_result, draft

    logger.info("Running reflection/self-check on draft (%d chars)", len(draft))

    # --- Reflection ---
    reflection = _run_reflection(request, goal, document_type, assumptions, plan_tasks, draft)

    # --- Revision (triggered only on Needs Revision / Poor grades) ---
    if not reflection.passed and (reflection.issues_found or reflection.improvements_applied):
        logger.info(
            "Reflection graded document as '%s' with %d issues. Performing one revision pass.",
            reflection.grade,
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
    """Execute the reflection/self-check with resilient parsing and soft-fail."""
    user_prompt = build_reflection_prompt(
        request, goal, document_type, assumptions, plan_tasks, draft
    )

    try:
        # call reflection model with 10s timeout
        raw_text = call_llm(
            system_prompt=REFLECTION_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            temperature=0.3,
            max_tokens=800,
            timeout=10.0,
            profile="reflection"
        )
        
        parsed = parse_reflection_response(raw_text)
        grade = parsed.get("grade", "Satisfactory")
        
        # Only trigger the revision pass if the grade is Needs Revision or Poor
        passed = grade not in ["Needs Revision", "Poor"]
        
        result = ReflectionResult(
            passed=passed,
            grade=grade,
            reason=parsed.get("reason", ""),
            issues_found=parsed.get("issues_found", []),
            improvements_applied=parsed.get("improvements", []),
            error=False
        )
        logger.info("Reflection result: grade=%s, passed=%s, issues=%d", result.grade, result.passed, len(result.issues_found))
        return result

    except Exception as e:
        logger.error("Reflection failed or timed out: %s. Defaulting to Acceptable (fail open).", e)
        return ReflectionResult(
            passed=True,  # Fail open gracefully
            grade="Provider Error",
            reason=f"Reflection skipped due to timeout or error: {str(e)[:80]}",
            issues_found=[],
            improvements_applied=[],
            error=True
        )


def _run_revision(
    draft: str,
    issues: list[str],
    improvements: list[str],
) -> str:
    """Execute one revision pass on the draft with a timeout."""
    user_prompt = build_revision_prompt(draft, issues, improvements)

    try:
        # Revision uses deep_analysis profile with 30s timeout
        revised = call_llm(
            system_prompt=REVISION_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            temperature=0.4,
            max_tokens=None,  # type: ignore
            timeout=30.0,
            profile="deep_analysis"
        )
        return revised

    except Exception as e:
        logger.error("Revision failed or timed out: %s. Keeping original draft.", e)
        return ""
