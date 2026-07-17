import openai
import os
import sys
import time
from dotenv import load_dotenv

load_dotenv("/Users/ishanbhattacharjee/Desktop/AgentDoc_Project/.env")

def main():
    api_key = os.getenv("LLM_API_KEY")
    base_url = os.getenv("LLM_BASE_URL", "https://opencode.ai/zen/v1")
    model = "deepseek-v4-flash-free"
    
    if not api_key:
        print("Error: LLM_API_KEY is not set.")
        sys.exit(1)
        
    print(f"Connecting to {base_url} with model {model}...")
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
    
    print("\n--- Sending request ---")
    start_time = time.time()
    try:
        response_stream = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": STANDARD_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.4,
            max_tokens=8000,
            stream=True
        )
        
        chunk_count = 0
        content_chunks = []
        reasoning_chunks = []
        
        for chunk in response_stream:
            chunk_count += 1
            if not chunk.choices:
                continue
            delta = chunk.choices[0].delta
            
            content_text = delta.content or ""
            reasoning_text = getattr(delta, "reasoning", None) or getattr(delta, "reasoning_content", None) or ""
            
            if content_text:
                content_chunks.append(content_text)
            if reasoning_text:
                reasoning_chunks.append(reasoning_text)
                
            if chunk_count <= 20:
                print(f"Chunk {chunk_count}: content='{content_text}', reasoning='{reasoning_text}'")
            elif chunk_count % 100 == 0:
                print(f"Chunk {chunk_count}... content length so far: {len(''.join(content_chunks))}, reasoning length so far: {len(''.join(reasoning_chunks))}")
                
        elapsed = time.time() - start_time
        print(f"\nFinished in {elapsed:.2f} seconds!")
        print(f"Total chunks: {chunk_count}")
        print(f"Total content characters: {len(''.join(content_chunks))}")
        print(f"Total reasoning characters: {len(''.join(reasoning_chunks))}")
        print(f"First 200 chars of content: {''.join(content_chunks)[:200]}")
        
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    main()
