import asyncio
from app.main import run_agent

def run_test(prompt, format_ext="pdf"):
    print(f"\n--- Testing: {prompt} ---")
    response = run_agent(prompt, format=format_ext)
    print("Goal:", response.goal)
    print("Type:", response.document_type)
    print("Confidence:", response.confidence)
    print("Complexity:", response.complexity)
    print("Reading Time:", response.reading_time)
    print("Effort:", response.implementation_effort)
    print("Planning Summary:", response.planning_summary)
    print("Tasks:", len(response.plan))
    print("Reflection Grade:", response.reflection.get('grade') if response.reflection else 'None')
    print("Document:", response.document_filename)
    print("Execution Time:", response.total_execution_time, "s")
    print("LLM Calls:", response.llm_call_count)
    print("Tokens Used:", response.llm_tokens_used)
    print("Cache Status:", response.cache_status)
    if response.execution_results:
        print("\n--- First Task Execution Result Card Details ---")
        first = response.execution_results[0]
        print("Task Name:", first.get("task"))
        print("Executive Summary:", first.get("executive_summary")[:150] + "...")
        print("Key Findings Count:", len(first.get("key_findings", [])))
        print("Recommendations Count:", len(first.get("recommendations", [])))
        print("Important Decisions Count:", len(first.get("important_decisions", [])))
        print("Primary Risk:", first.get("risks"))
        print("Mitigation:", first.get("mitigation"))
        print("Tradeoff:", first.get("tradeoff"))
        print("Deliverables Count:", len(first.get("deliverables", [])))

if __name__ == "__main__":
    prompt = (
        "We need to improve customer onboarding because users are dropping off, "
        "but we don't know exactly where. Create a practical improvement plan "
        "that can be presented to leadership. We want results quickly, the budget is limited, "
        "and engineering capacity is small. Decide what should be investigated first, "
        "make reasonable assumptions where information is missing, prioritize actions, "
        "define success metrics, risks, and a phased 90-day plan. (Fresh Run Phase 6 Polish)"
    )
    run_test(prompt, format_ext="pdf")
    
