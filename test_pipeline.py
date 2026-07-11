import asyncio
from app.main import run_agent

def run_test(prompt, format_ext="docx"):
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

if __name__ == "__main__":

    
    run_test("Create a project plan for launching an AI-powered customer support chatbot for a mid-sized e-commerce company.", format_ext="html")
    run_test("Create a Standard Operating Procedure (SOP) for new employee onboarding in a remote-first tech startup.", format_ext="pdf")
    
