import openai
import os
from dotenv import load_dotenv

load_dotenv("/Users/ishanbhattacharjee/Desktop/AgentDoc_Project/.env")

def test_effort(client, model, effort_value):
    kwargs = {}
    if effort_value:
        kwargs["reasoning_effort"] = effort_value
    print(f"Calling {model} with reasoning_effort={effort_value}...", flush=True)
    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "user", "content": "Write a 3-sentence description of Tokyo."}
            ],
            stream=False,
            timeout=30,
            **kwargs
        )
        usage = response.usage
        ctd = getattr(usage, "completion_tokens_details", None)
        r_tokens = getattr(ctd, "reasoning_tokens", None) if ctd else None
        print(f"SUCCESS: Completion: {usage.completion_tokens} | Reasoning: {r_tokens}", flush=True)
    except Exception as e:
        print(f"FAILED: {e}", flush=True)

def main():
    api_key = os.getenv("LLM_API_KEY")
    base_url = os.getenv("LLM_BASE_URL", "https://opencode.ai/zen/v1")
    client = openai.Client(api_key=api_key, base_url=base_url)
    
    # Just test deepseek-v4-flash-free
    test_effort(client, "deepseek-v4-flash-free", None)
    test_effort(client, "deepseek-v4-flash-free", "none")
    test_effort(client, "deepseek-v4-flash-free", "minimal")
    test_effort(client, "deepseek-v4-flash-free", "low")

if __name__ == "__main__":
    main()
