import openai
import os
from dotenv import load_dotenv

load_dotenv("/Users/ishanbhattacharjee/Desktop/AgentDoc_Project/.env")

def test_effort(client, model, effort_value):
    kwargs = {}
    if effort_value:
        kwargs["reasoning_effort"] = effort_value
        
    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Plan a 3-day itinerary for Tokyo. Be detailed."}
            ],
            stream=False,
            **kwargs
        )
        usage = response.usage
        ctd = getattr(usage, "completion_tokens_details", None)
        r_tokens = getattr(ctd, "reasoning_tokens", None) if ctd else None
        print(f"Model: {model} | reasoning_effort={effort_value} => Completion: {usage.completion_tokens} | Reasoning: {r_tokens}")
    except Exception as e:
        print(f"Model: {model} | reasoning_effort={effort_value} => FAILED: {e}")

def main():
    api_key = os.getenv("LLM_API_KEY")
    base_url = os.getenv("LLM_BASE_URL", "https://opencode.ai/zen/v1")
    client = openai.Client(api_key=api_key, base_url=base_url)
    
    for model in ["deepseek-v4-flash-free", "hy3-free"]:
        print(f"\n--- Comparing reasoning effort for {model} ---")
        test_effort(client, model, None)
        test_effort(client, model, "low")
        test_effort(client, model, "medium")
        test_effort(client, model, "high")

if __name__ == "__main__":
    main()
