import openai
import os
import sys
import time
from dotenv import load_dotenv

load_dotenv("/Users/ishanbhattacharjee/Desktop/AgentDoc_Project/.env")

def test_model(model_name):
    api_key = os.getenv("LLM_API_KEY")
    base_url = os.getenv("LLM_BASE_URL", "https://opencode.ai/zen/v1")
    
    print(f"\n========================================\nTesting Model: {model_name}\n========================================")
    client = openai.Client(api_key=api_key, base_url=base_url)
    
    from app.prompts.standard_prompt import STANDARD_SYSTEM_PROMPT, STANDARD_USER_PROMPT_TEMPLATE
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
    
    start_time = time.time()
    try:
        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": STANDARD_SYSTEM_PROMPT},
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
        total_tokens = usage.total_tokens
        
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
        print(f"First 100 chars: {content[:100].strip().replace('\n', ' ')}")
        return True
    except Exception as e:
        print(f"Status: Failed - {e}")
        return False

def main():
    models = [
        "gemini-3.5-flash",
        "gemini-3-flash",
        "gpt-5.4-mini",
        "gpt-5.4-nano",
        "deepseek-v4-flash"
    ]
    for model in models:
        test_model(model)

if __name__ == "__main__":
    main()
