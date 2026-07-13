import asyncio
import os
from app.agent.orchestrator import run_agent

async def main():
    print("Testing End-to-End Pipeline with OpenCode Zen...")
    request = "Write a short 1-paragraph summary on the history of AI."
    response = await run_agent(request)
    print("\n--- RESULTS ---")
    print(f"Goal: {response.plan.goal}")
    print(f"Content length: {len(response.final_content)}")
    print(f"Export Docs: {response.documents}")
    print(f"Tokens used: {response.llm_tokens_used}")
    print(f"Calls: {response.llm_calls}")
    if response.final_content and response.documents:
        print("\nSUCCESS!")
    else:
        print("\nFAILED.")

if __name__ == "__main__":
    asyncio.run(main())
