import openai
import os
import sys
import time
from dotenv import load_dotenv

load_dotenv("/Users/ishanbhattacharjee/Desktop/AgentDoc_Project/.env")

OPTIMIZED_SYSTEM_PROMPT = """You are an autonomous business document generation agent.
Your job is to analyze the user's request, execute the plan phases, and return the complete, professionally written, final document directly in Markdown.

Do NOT wrap the document in a JSON object. Return the raw Markdown document starting directly with the '# Title'.

CRITICAL CONCISENESS & SPEED DIRECTIVES:
- Reason extremely briefly. Keep your internal thinking process minimal, direct, and concise. Do not write long chains of thought.
- Avoid all filler text, preambles, and introductory/concluding remarks.
- Write in a highly dense, McKinsey/BCG consultant-style format using punchy, action-oriented bullet points.
- Target exactly 800-1,000 words for the entire document. Keep sections short and high-impact.

1. DOCUMENT-LEVEL STRUCTURE (generate these sections ONCE, globally):
   - **Executive Summary**: A structured overview using bold headings: **Problem**, **Approach**, **Business Impact**, **Recommendation**, **Expected Outcome**, and **Estimated Timeline**. Write max 120 words total.
   - **Decision Snapshot** (markdown table with columns: Priority, Risk, Investment, Timeline, Expected ROI, Confidence)
   - **Key Takeaways**: 3-4 strategic insights distilled from all phases.
   - **Objectives & Scope**: Clear statement of what the document covers and boundaries.
   - **Consolidated Findings & Analysis**: Synthesized insights from all phases. Use professional tables where appropriate.
   - **Strategic Recommendations**: Split into Immediate, Short-Term, and Long-Term. Max 1 sentence per recommendation.
   - **Risk Register**: A single consolidated table of all risks, mitigations, and tradeoffs.
   - **Project Assumptions**: A single consolidated list of max 4 assumptions.
   - **Key Deliverables**: A single consolidated list of max 4 deliverables.
   - **Implementation Timeline & Roadmap**: A phased timeline with milestones and owners.
   - **Conclusion**: 2-3 sentences.

2. TASK/PHASE SECTIONS (concise execution metadata only):
   Each plan phase becomes a `## Phase N: [Phase Name]` section containing ONLY:
   - `### Summary`: A concise summary of the phase (max 60 words).
   - `### Key Outputs`: 3-5 short bullet points.
   - `### Important Decisions`: 1-2 decisions with 1-sentence rationale.

   Conditional fields (Dependencies, Risks, Status) must be omitted if not critical. No placeholders."""

def main():
    api_key = os.getenv("LLM_API_KEY")
    base_url = os.getenv("LLM_BASE_URL", "https://opencode.ai/zen/v1")
    model = "mimo-v2.5-free"
    
    client = openai.Client(api_key=api_key, base_url=base_url)
    
    from app.prompts.standard_prompt import STANDARD_USER_PROMPT_TEMPLATE
    from app.agent.templates import get_template
    
    template = get_template("project_plan")
    phases_text = "\n".join(f"- Phase {p['id']}: {p['task']} (Purpose: {p['purpose']})" for p in template["phases"])
    assumptions_text = "\n".join(f"- {a}" for a in template["assumptions"])
    
    prompt = (
        "Create a professional project plan for launching an AI-powered customer support chatbot for a mid-sized e-commerce company.\n\n"
        "Include:\n\n"
        "- Executive Summary\n"
        "- Business Objectives\n"
        "- Scope (In Scope / Out of Scope)\n"
        "- Key Assumptions\n"
        "- Stakeholder Analysis\n"
        "- Team Roles & Responsibilities (RACI)\n"
        "- Implementation Timeline (12 weeks)\n"
        "- Technical Architecture Overview\n"
        "- Risk Assessment & Mitigation\n"
        "- Budget Considerations\n"
        "- Success Metrics (KPIs)\n"
        "- Deployment Strategy\n"
        "- Post-launch Monitoring\n"
        "- Next Steps\n\n"
        "Present the document in a consultant-style format suitable for senior leadership."
    )
    
    user_prompt = STANDARD_USER_PROMPT_TEMPLATE.format(
        document_type_title="Project Plan",
        request=prompt,
        goal="Generate a Project Plan addressing: " + prompt,
        assumptions=assumptions_text,
        phases=phases_text
    )
    
    print("\n--- Sending request with optimized system prompt ---")
    start_time = time.time()
    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": OPTIMIZED_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.4,
            max_tokens=8000,
            stream=False
        )
        
        elapsed = time.time() - start_time
        usage = response.usage
        prompt_tokens = usage.prompt_tokens
        completion_tokens = usage.completion_tokens
        
        ctd = getattr(usage, "completion_tokens_details", None)
        reasoning_tokens = 0
        if ctd:
            reasoning_tokens = getattr(ctd, "reasoning_tokens", 0)
        elif isinstance(getattr(usage, "completion_tokens_details", None), dict):
            reasoning_tokens = getattr(usage, "completion_tokens_details", {}).get("reasoning_tokens", 0)
            
        content = response.choices[0].message.content or ""
        print(f"Status: Success")
        print(f"Time: {elapsed:.2f}s")
        print(f"Prompt Tokens: {prompt_tokens}")
        print(f"Completion Tokens: {completion_tokens}")
        print(f"Reasoning Tokens: {reasoning_tokens}")
        print(f"Visible Content Tokens (Approx): {completion_tokens - reasoning_tokens}")
        print(f"Content Length: {len(content)} chars")
        print(f"First 200 chars: {content[:200].strip().replace('\n', ' ')}")
        
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    main()
