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
        response_stream = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "user", "content": "Write a 3-sentence description of Tokyo."}
            ],
            stream=True
        )
        
        print("\n--- STREAM CHUNKS ---")
        for chunk in response_stream:
            if not chunk.choices:
                continue
            delta = chunk.choices[0].delta
            
            content = getattr(delta, "content", None)
            reasoning = getattr(delta, "reasoning", None)
            reasoning_content = getattr(delta, "reasoning_content", None)
            
            if content:
                print(f"[CONTENT] {repr(content)}")
            if reasoning:
                print(f"[REASONING] {repr(reasoning)}")
            if reasoning_content:
                print(f"[REASONING_CONTENT] {repr(reasoning_content)}")
                
    except Exception as e:
        print(f"API Call failed: {e}")

if __name__ == "__main__":
    main()
