import asyncio
from app.main import run_agent

def run_test(prompt):
    print(f"\n--- Testing: {prompt} ---")
    response = run_agent(prompt)
    print("Goal:", response.goal)
    print("Type:", response.document_type)
    print("Confidence:", response.confidence)
    print("Complexity:", response.complexity)
    print("Planning Summary:", response.planning_summary)
    print("Tasks:", len(response.plan))
    print("Reflection Grade:", response.reflection['grade'])
    print("Document:", response.document_filename)

if __name__ == "__main__":
    import os
    os.environ["LLM_PROVIDER"] = "groq"
    
    run_test("Create a project plan for launching an AI-powered customer support chatbot for a mid-sized e-commerce company.")
    run_test("Create a Standard Operating Procedure (SOP) for new employee onboarding in a remote-first tech startup.")
    
