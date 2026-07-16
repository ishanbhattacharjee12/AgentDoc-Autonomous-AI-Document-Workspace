import os
import logging
from app.agent.orchestrator import run_agent

logging.basicConfig(level=logging.INFO)

def main():
    print("Testing End-to-End Pipeline with OpenCode Zen...")
    request = "Write a short 1-paragraph summary on the history of AI."
    response = run_agent(request)
    print("\n--- RESULTS ---")
    print(f"Goal: {response.goal}")
    print(f"Content length: {len(response.summary) if response.summary else 0}")
    print(f"Export Docs: {response.document_filename}")
    print(f"Tokens used: {response.llm_tokens_used}")
    print(f"Calls: {response.llm_call_count}")
    print(f"Stage Metrics: {response.stage_metrics}")
    if response.summary and response.document_filename:
        print("\nSUCCESS!")
    else:
        print("\nFAILED.")

if __name__ == "__main__":
    main()
