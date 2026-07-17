import openai
import os
import sys
from dotenv import load_dotenv

load_dotenv("/Users/ishanbhattacharjee/Desktop/AgentDoc_Project/.env")

def main():
    api_key = os.getenv("LLM_API_KEY")
    base_url = os.getenv("LLM_BASE_URL", "https://opencode.ai/zen/v1")
    model = "deepseek-v4-flash-free"
    
    if not api_key:
        print("Error: LLM_API_KEY is not set.")
        sys.exit(1)
        
    client = openai.Client(api_key=api_key, base_url=base_url)
    print(f"Connecting to {base_url} with model {model}...")
    
    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Write a very long essay (at least 15 paragraphs) about the history of space exploration."}
            ],
            max_tokens=8000,
            stream=False
        )
        print("\n=== SUCCESS ===")
        usage = response.usage
        print(f"Prompt Tokens: {usage.prompt_tokens}")
        print(f"Completion Tokens: {usage.completion_tokens}")
        ctd = getattr(usage, "completion_tokens_details", None)
        if ctd:
            print(f"  Reasoning Tokens: {getattr(ctd, 'reasoning_tokens', None)}")
        print(f"Finish Reason: {response.choices[0].finish_reason}")
        print(f"Output Length (Chars): {len(response.choices[0].message.content)}")
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    main()
