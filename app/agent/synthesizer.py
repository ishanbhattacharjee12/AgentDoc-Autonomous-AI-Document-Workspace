"""Synthesizer module.

Combines task execution results into a coherent document draft.
"""

import logging

from app.llm.client import call_llm
from app.prompts.synthesis_prompt import SYNTHESIS_SYSTEM_PROMPT, build_synthesis_prompt

logger = logging.getLogger(__name__)


def synthesize(
    request: str,
    goal: str,
    document_type: str,
    assumptions: list[str],
    execution_results: list[dict],
    token_cb=None,
) -> str:
    """Combine execution results into a document draft.

    Returns the synthesized document content as a string.
    """
    logger.info("Synthesizing %d execution results into document draft", len(execution_results))

    # Filter to only successful results with content
    valid_results = [
        r for r in execution_results
        if r.get("status") in ("completed", "recovered") and r.get("content")
    ]

    if not valid_results:
        logger.warning("No successful execution results to synthesize.")
        return _minimal_draft(goal, assumptions)

    user_prompt = build_synthesis_prompt(
        request, goal, document_type, assumptions, valid_results
    )

    try:
        draft = call_llm(
            SYNTHESIS_SYSTEM_PROMPT,
            user_prompt,
            temperature=0.5,
            max_tokens=4000,
            token_callback=token_cb,
        )
        logger.info("Synthesis completed: %d characters", len(draft))
        return draft

    except Exception as e:
        logger.error("Synthesis failed: %s", e)
        return _minimal_draft(goal, assumptions)


def _minimal_draft(goal: str, assumptions: list[str]) -> str:
    """Create a minimal draft when synthesis fails."""
    parts = [f"## Document\n\n{goal}\n"]
    if assumptions:
        parts.append("## Assumptions\n")
        for a in assumptions:
            parts.append(f"- {a}")
    parts.append("\n## Note\n\nSynthesis was unable to fully combine execution results. "
                 "This document contains the interpreted goal and assumptions only.")
    return "\n".join(parts)
