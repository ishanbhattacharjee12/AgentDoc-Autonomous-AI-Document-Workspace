import sys
from pathlib import Path

# Add project root to python path
sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.tools.document_tool_backup import _generate_pdf as generate_pdf_before
from app.tools.document_tool import _generate_pdf as generate_pdf_after

# Load or define a sample draft
draft_path = Path("/Users/ishanbhattacharjee/Desktop/AgentDoc_Project/scratch/last_draft.md")
if draft_path.exists():
    content = draft_path.read_text(encoding="utf-8")
    print("Loaded existing draft from scratch/last_draft.md")
else:
    print("Creating sample draft for comparison...")
    content = """# Customer Onboarding Improvement Plan

## Executive Summary
**Problem:** Significant user drop-off during onboarding, with undefined root causes, limiting growth and increasing customer acquisition cost.  
**Approach:** A rapid, data-driven diagnostic followed by low-cost, high-impact interventions within 90 days.  
**Business Impact:** Reducing drop-off by 25% could increase conversion to active users by ~15%, directly impacting revenue and LTV.  
**Recommendation:** Implement a focused A/B testing framework on key onboarding steps, prioritizing friction removal.

## Decision Snapshot
| Priority | Risk | Investment | Timeline | Expected ROI | Confidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| High | Medium: Data gaps delay insights | Low (< $50K) | 90 Days | High: Increased conversion & reduced CAC | Medium-High |

## Key Takeaways
1.  **Diagnose Before Prescribing:** The immediate priority is to instrument analytics to pinpoint exact drop-off steps, not guess.
2.  **Leverage Low-Hanging Fruit:** Significant gains can be achieved with UX copy, flow simplification, and progressive profiling before major engineering work.
3.  **Embrace Iterative Sprints:** A 30-day cycle of measure-test-learn is optimal for limited resources and rapid feedback.
4.  **Define "Success" Upfront:** Establish a single primary metric (e.g., onboarding completion rate) to align all actions.

## Strategic Recommendations
* **Immediate (0-30 Days):** Instrument end-to-end analytics to map the drop-off funnel and identify the top three exit points.
* **Short-Term (31-60 Days):** Run A/B tests on simplifying the identified highest-drop-off step and clarifying introductory messaging.
* **Long-Term (61-90 Days):** Implement a progressive profiling system to reduce initial form length, and establish an ongoing experimentation cadence.

## Risk Register
| Risk | Probability | Impact | Mitigation | Tradeoff |
| :--- | :--- | :--- | :--- | :--- |
| **Insufficient Data** | High | High | Start with qualitative feedback (surveys, session replays) while analytics are set up. | Slower, less precise initial diagnosis. |
| **Engineering Capacity** | High | Medium | Prioritize non-engineering solutions (copy, flow reordering) first. | May delay technically complex fixes. |
"""

title = "Customer Onboarding Improvement Plan"
doc_type = "improvement_plan"
assumptions = [
    "Basic product analytics tools are accessible and can be implemented with current resources.",
    "Leadership accepts that some initiatives may not yield positive results.",
    "Teams are aligned on using a single primary metric for success."
]
goal = "Provide a recipe for onboarding improvement plan to show how to reduce drop-off rate of users."

# Create app/outputs directory if not exists
output_dir = Path("/Users/ishanbhattacharjee/Desktop/AgentDoc_Project/app/outputs")
output_dir.mkdir(exist_ok=True)

print("Generating 'before' PDF...")
try:
    generate_pdf_before(
        filepath=output_dir / "compare_before.pdf",
        title=title,
        document_type=doc_type,
        assumptions=assumptions,
        content=content,
        goal=goal,
        filename="compare_before.pdf"
    )
    print("Generated app/outputs/compare_before.pdf")
except Exception as e:
    print(f"Error generating before PDF: {e}")

print("Generating 'after' PDF...")
try:
    generate_pdf_after(
        filepath=output_dir / "compare_after.pdf",
        title=title,
        document_type=doc_type,
        assumptions=assumptions,
        content=content,
        goal=goal,
        filename="compare_after.pdf"
    )
    print("Generated app/outputs/compare_after.pdf")
except Exception as e:
    print(f"Error generating after PDF: {e}")

print("Done! Both PDFs generated successfully in app/outputs/")
