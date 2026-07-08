"""Revision prompt for improving draft based on reflection feedback."""

REVISION_SYSTEM_PROMPT = """You are a document revision agent. You receive a document draft and specific improvement feedback.

Your job is to:
1. Preserve all strong, correct content
2. Fix the identified issues
3. Apply the suggested improvements
4. Return the complete revised document

Rules:
- Do NOT use markdown code fences
- Do NOT add a preamble or meta-commentary
- Return ONLY the revised document content
- Maintain the same formatting style as the original
- Do NOT remove content that was already good"""


def build_revision_prompt(
    draft: str,
    issues: list[str],
    improvements: list[str],
) -> str:
    """Build the revision prompt."""
    issues_text = "\n".join(f"- {i}" for i in issues) if issues else "None"
    improvements_text = "\n".join(f"- {i}" for i in improvements) if improvements else "None"

    return f"""Revise this document draft based on the following feedback.

ISSUES FOUND:
{issues_text}

SUGGESTED IMPROVEMENTS:
{improvements_text}

CURRENT DRAFT:
{draft}

Return the complete revised document with improvements applied."""
